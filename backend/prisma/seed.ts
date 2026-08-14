import "dotenv/config";
import { PrismaClient, Role, IncidentStatus } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data — safe for development only
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@devpulse.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@devpulse.com',
      passwordHash,
      role: Role.MEMBER,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@devpulse.com',
      passwordHash,
      role: Role.VIEWER,
    },
  });

  const incident = await prisma.incident.create({
    data: {
      title: 'API latency spike on checkout service',
      description: 'p99 latency jumped from 200ms to 3s starting 09:14 UTC.',
      status: IncidentStatus.IN_PROGRESS,
      createdBy: admin.id,
    },
  });

  await prisma.comment.create({
    data: {
      incidentId: incident.id,
      userId: member.id,
      content: 'Checked the DB connection pool, looks saturated.',
    },
  });

  await prisma.auditLog.create({
    data: {
      incidentId: incident.id,
      userId: admin.id,
      action: 'STATUS_CHANGED_TO_IN_PROGRESS',
    },
  });

  console.log('Seed data created:');
  console.log({
    admin: admin.email,
    member: member.email,
    viewer: viewer.email,
  });
  console.log({ incident: incident.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });