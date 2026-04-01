// ============================================================
// Leaves (휴가) 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../prisma.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError, ForbiddenError } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/leaves ---
const getLeavesSchema = {
  query: z.object({
    userId: z.coerce.number().int().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED']).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    size: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
};

router.get('/', validate(getLeavesSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, status, page = 1, size = 20 } = req.query as {
      userId?: number; status?: string; page?: number; size?: number;
    };

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    // MEMBER/VIEWER는 자기 것만 볼 수 있음
    if (req.user!.role === 'MEMBER' || req.user!.role === 'VIEWER') {
      where.userId = req.user!.userId;
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: ((page as number) - 1) * (size as number),
        take: size as number,
      }),
      prisma.leave.count({ where }),
    ]);

    res.json({
      success: true,
      data: leaves,
      pagination: {
        page: page as number,
        size: size as number,
        total,
        totalPages: Math.ceil(total / (size as number)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/leaves ---
const createLeaveSchema = {
  body: z.object({
    type: z.enum(['ANNUAL', 'HALF_DAY_AM', 'HALF_DAY_PM', 'SICK', 'REMOTE', 'OTHER']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().optional(),
  }),
};

router.post('/', validate(createLeaveSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const leave = await prisma.leave.create({
      data: {
        userId: req.user!.userId,
        type: req.body.type,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        reason: req.body.reason,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/leaves/:id/approve ---
router.patch(
  '/:id/approve',
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const leave = await prisma.leave.findUnique({ where: { id: Number(req.params.id) } });
      if (!leave) throw new NotFoundError('Leave request');

      const updated = await prisma.leave.update({
        where: { id: Number(req.params.id) },
        data: { status: 'APPROVED', approvedBy: req.user!.userId },
        include: { user: { select: { id: true, name: true } } },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// --- PATCH /api/leaves/:id/reject ---
router.patch(
  '/:id/reject',
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const leave = await prisma.leave.findUnique({ where: { id: Number(req.params.id) } });
      if (!leave) throw new NotFoundError('Leave request');

      const updated = await prisma.leave.update({
        where: { id: Number(req.params.id) },
        data: { status: 'REJECTED', approvedBy: req.user!.userId },
        include: { user: { select: { id: true, name: true } } },
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// --- DELETE /api/leaves/:id (본인만 취소 가능, PENDING 상태만) ---
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const leave = await prisma.leave.findUnique({ where: { id: Number(req.params.id) } });
    if (!leave) throw new NotFoundError('Leave request');

    // 본인 것만 취소 가능 (ADMIN 제외)
    if (leave.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      throw new ForbiddenError('You can only cancel your own leave requests');
    }

    if (leave.status !== 'PENDING') {
      throw new ForbiddenError('Only PENDING leave requests can be canceled');
    }

    const updated = await prisma.leave.update({
      where: { id: Number(req.params.id) },
      data: { status: 'CANCELED' },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
