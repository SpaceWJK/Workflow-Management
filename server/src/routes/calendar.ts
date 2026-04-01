// ============================================================
// Calendar 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../prisma.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/calendar ---
// 기간 내 Task의 startDate/dueDate + Leave를 캘린더 이벤트로 반환
const getCalendarSchema = {
  query: z.object({
    start: z.string().min(1, 'Start date is required'),  // ISO date string
    end: z.string().min(1, 'End date is required'),
    projectId: z.coerce.number().int().optional(),
  }),
};

router.get('/', validate(getCalendarSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { start, end, projectId } = req.query as unknown as { start: string; end: string; projectId?: number };
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Task 이벤트
    const taskWhere: Record<string, unknown> = {
      isDeleted: false,
      OR: [
        { startDate: { gte: startDate, lte: endDate } },
        { dueDate: { gte: startDate, lte: endDate } },
        { AND: [{ startDate: { lte: startDate } }, { dueDate: { gte: endDate } }] },
      ],
    };
    if (projectId) taskWhere.projectId = projectId;

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Leave 이벤트
    const leaves = await prisma.leave.findMany({
      where: {
        OR: [
          { startDate: { gte: startDate, lte: endDate } },
          { endDate: { gte: startDate, lte: endDate } },
          { AND: [{ startDate: { lte: startDate } }, { endDate: { gte: endDate } }] },
        ],
        status: { in: ['APPROVED', 'PENDING'] },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    const events = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...tasks.map((t: any) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        start: t.startDate,
        end: t.dueDate,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee,
        project: t.project,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...leaves.map((l: any) => ({
        type: 'leave' as const,
        id: l.id,
        title: `${l.user.name} - ${l.type}`,
        start: l.startDate,
        end: l.endDate,
        user: l.user,
        leaveType: l.type,
        leaveStatus: l.status,
      })),
    ];

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

export default router;
