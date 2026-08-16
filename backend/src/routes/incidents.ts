import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';

const router = Router();

// All incident routes require authentication
router.use(requireAuth);

// CREATE incident — ADMIN and MEMBER only
router.post('/', requireRole('ADMIN', 'MEMBER'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        createdBy: req.user!.userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        incidentId: incident.id,
        userId: req.user!.userId,
        action: 'INCIDENT_CREATED',
      },
    });

    res.status(201).json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LIST incidents — everyone (including VIEWER) can read
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    const incidents = await prisma.incident.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json(incidents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single incident (with comments and audit logs) — everyone can read
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const incidentId = req.params.id as string;

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(incident);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE status — ADMIN and MEMBER only
router.patch('/:id/status', requireRole('ADMIN', 'MEMBER'), async (req: AuthRequest, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        incidentId: updated.id,
        userId: req.user!.userId,
        action: `STATUS_CHANGED_TO_${status}`,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADD comment — ADMIN and MEMBER only (VIEWER read-only)
router.post('/:id/comments', requireRole('ADMIN', 'MEMBER'), async (req: AuthRequest, res: Response) => {
  try {
    const incidentId = req.params.id as string;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        incidentId: incidentId,
        userId: req.user!.userId,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        incidentId: incidentId,
        userId: req.user!.userId,
        action: 'COMMENT_ADDED',
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// LIST comments — everyone can read
router.get('/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const incidentId = req.params.id as string;

    const comments = await prisma.comment.findMany({
      where: { incidentId: incidentId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;