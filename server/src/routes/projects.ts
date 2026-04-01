// ============================================================
// Projects 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as projectService from '../services/project.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/projects ---
const getProjectsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    size: z.coerce.number().int().positive().max(100).optional().default(20),
  }),
};

router.get('/', validate(getProjectsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.getProjects(req.query as never);
    res.json({ success: true, data: result.projects, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/projects ---
const createProjectSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional(),
  }),
};

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createProjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const project = await projectService.createProject(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },
);

// --- GET /api/projects/:id ---
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const project = await projectService.getProjectById(Number(req.params.id));
    res.json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/projects/:id ---
const updateProjectSchema = {
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional(),
    version: z.number().int().min(0),
  }),
};

router.put(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateProjectSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const project = await projectService.updateProject(Number(req.params.id), req.body);
      res.json({ success: true, data: project });
    } catch (err) {
      next(err);
    }
  },
);

// --- DELETE /api/projects/:id ---
router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await projectService.deleteProject(Number(req.params.id));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
