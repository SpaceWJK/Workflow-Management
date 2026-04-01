// ============================================================
// Team 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as teamService from '../services/team.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/team ---
const getTeamSchema = {
  query: z.object({
    projectId: z.coerce.number().int().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    size: z.coerce.number().int().positive().max(100).optional().default(50),
  }),
};

router.get('/', validate(getTeamSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await teamService.getTeamMembers(req.query as never);
    res.json({ success: true, data: result.members, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/team/workload ---
router.get('/workload', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const workload = await teamService.getTeamWorkload(projectId);
    res.json({ success: true, data: workload });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/team/:id ---
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const member = await teamService.getMemberById(Number(req.params.id));
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/team/:id/status ---
const updateStatusSchema = {
  body: z.object({
    status: z.string().min(1, 'Status is required'),
  }),
};

router.patch(
  '/:id/status',
  authorize('ADMIN', 'MANAGER'),
  validate(updateStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await teamService.updateMemberStatus(Number(req.params.id), req.body.status);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
