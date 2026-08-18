import {
  describe,
  it,
  expect,
  afterAll,
} from 'vitest';

import request from 'supertest';
import express from 'express';

import authRoutes from '../routes/auth';
import { prisma } from '../lib/prisma';

const app = express();

app.use(express.json());
app.use('/auth', authRoutes);

const testEmail = `test-${Date.now()}@devpulse.com`;

describe('Auth routes', () => {
  it('should sign up a new user', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.accessToken).toBeDefined();
  });

  it('should reject duplicate signup', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(409);
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