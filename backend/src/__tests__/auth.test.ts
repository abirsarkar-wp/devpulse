import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from 'vitest';

import bcrypt from 'bcrypt';
import request from 'supertest';
import express from 'express';

import authRoutes from '../routes/auth';
import { prisma } from '../lib/prisma';

const app = express();

app.use(express.json());
app.use('/auth', authRoutes);

const testEmail = `test-${Date.now()}@devpulse.com`;

describe('Auth routes', () => {
  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 10);

    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
      },
    });
  });

  it('should not expose the signup endpoint', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(404);
  });

  it('should reject login with missing credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({});

    expect(res.status).toBe(400);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      email: testEmail,
    },
  });

  await prisma.$disconnect();
});
