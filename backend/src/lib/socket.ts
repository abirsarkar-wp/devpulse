import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from './jwt';

let io: SocketIOServer;

export async function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  // Redis adapter setup
  const pubClient = createClient({
    url: 'redis://localhost:6379',
  });

  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(
      `Socket connected: ${socket.id}, user: ${(socket as any).user?.userId}`
    );

    // Join an incident-specific room
    socket.on('join_incident', (incidentId: string) => {
      socket.join(`incident:${incidentId}`);

      console.log(
        `Socket ${socket.id} joined incident:${incidentId}`
      );
    });

    // Leave an incident-specific room
    socket.on('leave_incident', (incidentId: string) => {
      socket.leave(`incident:${incidentId}`);

      console.log(
        `Socket ${socket.id} left incident:${incidentId}`
      );
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }

  return io;
}