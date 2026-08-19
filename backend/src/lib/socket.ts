import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import * as Y from 'yjs';
import { verifyAccessToken } from './jwt';
import { prisma } from './prisma';

const MAX_DOCUMENT_SIZE = 100 * 1024;
const PERSIST_DELAY_MS = 1500;
type SocketUser = { userId: string; role: string; email: string };
type Participant = { userId: string; email: string };
let io: SocketIOServer;
const documents = new Map<string, Y.Doc>();
const persistTimers = new Map<string, NodeJS.Timeout>();
const presence = new Map<string, Map<string, Participant>>();
const roomName = (incidentId: string) => `incident:${incidentId}`;
const toBase64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

function fromBase64(value: unknown): Uint8Array | null {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) return null;
  try { const buffer = Buffer.from(value, 'base64'); return buffer.length ? new Uint8Array(buffer) : null; } catch { return null; }
}

async function getOrCreateDoc(incidentId: string) {
  const cached = documents.get(incidentId);
  if (cached) return cached;
  const doc = new Y.Doc();
  const note = await prisma.incidentNote.findUnique({ where: { incidentId } });
  if (note?.state) {
    const update = fromBase64(note.state);
    if (!update) console.error(`Invalid persisted Yjs state for incident ${incidentId}`);
    else try { Y.applyUpdate(doc, update, 'database'); } catch (error) { console.error(`Unable to restore Yjs state for incident ${incidentId}`, error); }
  }
  documents.set(incidentId, doc);
  return doc;
}

async function persistDocument(incidentId: string, doc = documents.get(incidentId)) {
  if (!doc) return true;
  try {
    const state = toBase64(Y.encodeStateAsUpdate(doc));
    if (Buffer.byteLength(state, 'base64') > MAX_DOCUMENT_SIZE) { console.error(`Refusing to persist oversized runbook for incident ${incidentId}`); return false; }
    await prisma.incidentNote.upsert({ where: { incidentId }, create: { incidentId, state }, update: { state } });
    return true;
  } catch (error) { console.error(`Failed to persist runbook for incident ${incidentId}`, error); return false; }
}

function schedulePersistence(incidentId: string, doc = documents.get(incidentId)) {
  const timer = persistTimers.get(incidentId);
  if (timer) clearTimeout(timer);
  persistTimers.set(incidentId, setTimeout(() => { persistTimers.delete(incidentId); void persistDocument(incidentId, doc); }, PERSIST_DELAY_MS));
}

function broadcastPresence(incidentId: string) {
  io.to(roomName(incidentId)).emit('presence:update', Array.from(presence.get(incidentId)?.values() ?? []));
}

function removePresence(socketId: string, incidentId: string) {
  const viewers = presence.get(incidentId);
  if (!viewers?.delete(socketId)) return;
  if (viewers.size) { broadcastPresence(incidentId); return; }
  presence.delete(incidentId); broadcastPresence(incidentId);
  const doc = documents.get(incidentId); const timer = persistTimers.get(incidentId);
  if (timer) clearTimeout(timer); persistTimers.delete(incidentId);
  if (!doc) return;
  void persistDocument(incidentId, doc).then((saved) => {
    if (saved && !presence.has(incidentId) && documents.get(incidentId) === doc) documents.delete(incidentId);
    else if (!saved && !presence.has(incidentId)) schedulePersistence(incidentId, doc);
  });
}

export async function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
  const pubClient = createClient({ url: 'redis://localhost:6379' }); const subClient = pubClient.duplicate();
  await pubClient.connect(); await subClient.connect(); io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token provided'));
    try {
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true, role: true } });
      if (!user) return next(new Error('User not found'));
      (socket as typeof socket & { user: SocketUser }).user = { userId: payload.userId, role: user.role, email: user.email };
      next();
    } catch { next(new Error('Invalid or expired token')); }
  });

  io.on('connection', (socket) => {
    const user = (socket as typeof socket & { user: SocketUser }).user;
    console.log(`Socket connected: ${socket.id}, user: ${user.userId}`);
    socket.on('join_incident', (incidentId: string) => socket.join(roomName(incidentId)));
    socket.on('leave_incident', (incidentId: string) => socket.leave(roomName(incidentId)));
    socket.on('notes:join', async (incidentId: unknown) => {
      if (typeof incidentId !== 'string') return socket.emit('notes:error', 'Invalid incident ID');
      try {
        const incident = await prisma.incident.findUnique({ where: { id: incidentId }, select: { id: true } });
        if (!incident) return socket.emit('notes:error', 'Incident not found');
        const doc = await getOrCreateDoc(incidentId); socket.join(roomName(incidentId));
        const viewers = presence.get(incidentId) ?? new Map<string, Participant>();
        viewers.set(socket.id, { userId: user.userId, email: user.email }); presence.set(incidentId, viewers);
        socket.emit('notes:sync', { incidentId, update: toBase64(Y.encodeStateAsUpdate(doc)) }); broadcastPresence(incidentId);
      } catch (error) { console.error(`Unable to join runbook for incident ${incidentId}`, error); socket.emit('notes:error', 'Unable to load shared runbook'); }
    });
    socket.on('notes:update', async (payload: { incidentId?: unknown; update?: unknown }) => {
      const incidentId = payload?.incidentId;
      if (typeof incidentId !== 'string' || !presence.get(incidentId)?.has(socket.id)) return socket.emit('notes:error', 'Join the shared runbook before editing');
      const update = fromBase64(payload.update);
      if (!update) return socket.emit('notes:error', 'Malformed collaborative update');
      if (update.byteLength > MAX_DOCUMENT_SIZE) return socket.emit('notes:error', 'Runbook update exceeds the 100 KB limit');
      try {
        const doc = await getOrCreateDoc(incidentId); const candidate = new Y.Doc();
        Y.applyUpdate(candidate, Y.encodeStateAsUpdate(doc)); Y.applyUpdate(candidate, update);
        if (Y.encodeStateAsUpdate(candidate).byteLength > MAX_DOCUMENT_SIZE) return socket.emit('notes:error', 'Shared runbook exceeds the 100 KB limit');
        Y.applyUpdate(doc, update, socket.id); socket.to(roomName(incidentId)).emit('notes:update', { incidentId, update: toBase64(update) }); schedulePersistence(incidentId, doc);
      } catch (error) { console.error(`Unable to apply runbook update for incident ${incidentId}`, error); socket.emit('notes:error', 'Unable to apply collaborative update'); }
    });
    socket.on('notes:leave', (incidentId: unknown) => { if (typeof incidentId === 'string') removePresence(socket.id, incidentId); });
    socket.on('disconnect', () => { for (const [incidentId, viewers] of presence) if (viewers.has(socket.id)) removePresence(socket.id, incidentId); console.log(`Socket disconnected: ${socket.id}`); });
  });
  return io;
}

export function getIO() { if (!io) throw new Error('Socket.io not initialized'); return io; }
