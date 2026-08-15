import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { requireAuth, AuthRequest } from './middleware/auth';
import { requireRole } from './middleware/requireRole';
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

app.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({
    message: 'You are authenticated',
    user: req.user,
  });
});
app.get('/admin-test', requireAuth, requireRole('ADMIN'), (req: AuthRequest, res) => {
  res.json({
    message: 'You have admin access',
    user: req.user,
  });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});