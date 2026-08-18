import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

import authRoutes from './routes/auth';
import incidentRoutes from './routes/incidents';
import { requireAuth, AuthRequest } from './middleware/auth';
import { initSocket } from './lib/socket';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/incidents', incidentRoutes);

app.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({
    message: 'You are authenticated',
    user: req.user,
  });
});

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.io before starting the server
initSocket(httpServer)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize socket server:', err);
    process.exit(1);
  });