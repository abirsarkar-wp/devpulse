import { useCallback, useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { getSocket } from './socket';

export type Participant = { userId: string; email: string };
export type CollabStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

const REMOTE_ORIGIN = Symbol('remote');

function encodeBase64(update: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < update.length; index += chunkSize) {
    binary += String.fromCharCode(...update.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(value: unknown): Uint8Array | null {
  if (typeof value !== 'string') return null;
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch { return null; }
}

export function useCollabNotes(incidentId: string | undefined) {
  const [value, setValue] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [status, setStatus] = useState<CollabStatus>('connecting');
  const [error, setError] = useState('');
  const docRef = useRef<Y.Doc | null>(null);
  const textRef = useRef<Y.Text | null>(null);
  const localOriginRef = useRef({});

  useEffect(() => {
    if (!incidentId) return;
    const doc = new Y.Doc(); const notes = doc.getText('notes'); const socket = getSocket();
    docRef.current = doc; textRef.current = notes; setValue(notes.toString()); setParticipants([]); setError('');
    setStatus(socket.connected ? 'connecting' : 'connecting');
    const join = () => socket.emit('notes:join', incidentId);
    const updateText = () => setValue(notes.toString());
    const sendUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === localOriginRef.current) socket.emit('notes:update', { incidentId, update: encodeBase64(update) });
    };
    const sync = (payload: { incidentId?: string; update?: unknown }) => {
      if (payload.incidentId !== incidentId) return;
      const update = decodeBase64(payload.update);
      if (!update) { setError('Received an invalid shared runbook update'); setStatus('error'); return; }
      Y.applyUpdate(doc, update, REMOTE_ORIGIN); setStatus('connected'); setError('');
    };
    const remoteUpdate = sync;
    const updatePresence = (next: Participant[]) => setParticipants(Array.isArray(next) ? next : []);
    const socketError = (message: unknown) => { setError(typeof message === 'string' ? message : 'Shared runbook connection failed'); setStatus('error'); };
    const disconnected = () => setStatus('reconnecting');
    const connectError = () => { setError('Unable to connect to the shared runbook'); setStatus('error'); };
    notes.observe(updateText); doc.on('update', sendUpdate);
    socket.on('connect', join); socket.on('notes:sync', sync); socket.on('notes:update', remoteUpdate);
    socket.on('presence:update', updatePresence); socket.on('notes:error', socketError); socket.on('disconnect', disconnected); socket.on('connect_error', connectError);
    if (socket.connected) join();
    return () => {
      socket.emit('notes:leave', incidentId); socket.off('connect', join); socket.off('notes:sync', sync); socket.off('notes:update', remoteUpdate);
      socket.off('presence:update', updatePresence); socket.off('notes:error', socketError); socket.off('disconnect', disconnected); socket.off('connect_error', connectError);
      notes.unobserve(updateText); doc.off('update', sendUpdate); doc.destroy();
      if (docRef.current === doc) { docRef.current = null; textRef.current = null; }
    };
  }, [incidentId]);

  const setNotes = useCallback((nextValue: string) => {
    const doc = docRef.current; const notes = textRef.current;
    if (!doc || !notes || nextValue === notes.toString()) return;
    const previous = notes.toString(); let start = 0;
    while (start < previous.length && start < nextValue.length && previous[start] === nextValue[start]) start += 1;
    let previousEnd = previous.length; let nextEnd = nextValue.length;
    while (previousEnd > start && nextEnd > start && previous[previousEnd - 1] === nextValue[nextEnd - 1]) { previousEnd -= 1; nextEnd -= 1; }
    doc.transact(() => { if (previousEnd > start) notes.delete(start, previousEnd - start); if (nextEnd > start) notes.insert(start, nextValue.slice(start, nextEnd)); }, localOriginRef.current);
  }, []);

  return { value, setNotes, participants, status, error };
}
