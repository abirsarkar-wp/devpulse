import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from 'vitest';

import request from 'supertest';
import express from 'express';

import authRoutes from '../routes/auth';
import incidentRoutes from '../routes/incidents';
import { prisma } from '../lib/prisma';

const app = express();

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/incidents', incidentRoutes);

let viewerToken: string;
let incidentId: string;

const viewerEmail = `viewer-test-${Date.now()}@devpulse.com`;
const memberEmail = `member-test-${Date.now()}@devpulse.com`;

describe('Role-based access control', () => {
  beforeAll(async () => {
    // Create VIEWER test user
    const viewerSignup = await request(app)
      .post('/auth/signup')
      .send({
        email: viewerEmail,
        password: 'password123',
      });

    expect(viewerSignup.status).toBe(201);

    const viewerId = viewerSignup.body.user.id;

    await prisma.user.update({
      where: { id: viewerId },
      data: { role: 'VIEWER' },
    });

    // Login as VIEWER
    const viewerLogin = await request(app)
      .post('/auth/login')
      .send({
        email: viewerEmail,
        password: 'password123',
      });

    expect(viewerLogin.status).toBe(200);

    viewerToken = viewerLogin.body.accessToken;

    // Create a MEMBER test user
    const memberSignup = await request(app)
      .post('/auth/signup')
      .send({
        email: memberEmail,
        password: 'password123',
      });

    expect(memberSignup.status).toBe(201);

    const memberId = memberSignup.body.user.id;

    await prisma.user.update({
      where: { id: memberId },
      data: { role: 'MEMBER' },
    });

    // Create test incident using MEMBER
    const incident = await prisma.incident.create({
      data: {
        title: 'RBAC Test Incident',
        description: 'Incident created for RBAC testing',
        createdBy: memberId,
      },
    });

    incidentId = incident.id;
  });

  afterAll(async () => {
    // Delete test incident
    if (incidentId) {
      await prisma.incident.delete({
        where: { id: incidentId },
      }).catch(() => {});
    }

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [viewerEmail, memberEmail],
        },
      },
    });

    await prisma.$disconnect();
  });

  it('VIEWER can list incidents', async () => {
    const res = await request(app)
      .get('/incidents')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
  });

  it('VIEWER cannot create an incident', async () => {
    const res = await request(app)
      .post('/incidents')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        title: 'Should fail',
        description: 'VIEWER should not create this',
      });

    expect(res.status).toBe(403);
  });

  it('VIEWER cannot change incident status', async () => {
    const res = await request(app)
      .patch(`/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        status: 'RESOLVED',
      });

    expect(res.status).toBe(403);
  });

  it('unauthenticated request is rejected', async () => {
    const res = await request(app)
      .get('/incidents');

    expect(res.status).toBe(401);
  });
});