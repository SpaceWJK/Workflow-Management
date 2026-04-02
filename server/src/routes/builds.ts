// ============================================================
// Builds 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as buildService from '../services/build.service.js';
import type { AuthenticatedRequest, BuildStatus } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/builds/targets?projectId=N ---
// 주의: /:id 보다 먼저 등록
router.get('/targets', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = Number(req.query.projectId);
    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const targets = await buildService.getUpdateTargets(projectId);
    res.json({ success: true, data: targets });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/builds/cdn-types?projectId=N ---
router.get('/cdn-types', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = Number(req.query.projectId);
    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }
    const types = await buildService.getCdnTypes(projectId);
    res.json({ success: true, data: types });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/builds ---
const getBuildsSchema = {
  query: z.object({
    projectId: z.coerce.number().int().optional(),
    status: z.string().optional(),
    updateTarget: z.string().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    size: z.coerce.number().int().positive().max(100).optional().default(20),
    sortBy: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};

router.get('/', validate(getBuildsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await buildService.getBuilds(req.query as never);
    res.json({ success: true, data: result.builds, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/builds ---
const createBuildSchema = {
  body: z.object({
    projectId: z.coerce.number().int().min(1),
    buildOrder: z.coerce.number().int().min(1),
    receivedDate: z.string().min(1),
    updateTarget: z.string().min(1),
    status: z.enum(['RECEIVED', 'TESTING', 'TEST_DONE', 'APPROVED', 'REJECTED', 'RELEASED']).optional(),
    memo: z.string().optional(),
    versions: z.array(z.object({
      buildType: z.enum(['APP', 'CDN']),
      platform: z.enum(['iOS', 'AOS', 'PC']).optional(),
      cdnType: z.string().max(100).optional(),
      version: z.string().min(1).max(100),
      note: z.string().optional(),
    })).optional(),
  }),
};

router.post('/', authorize('ADMIN', 'MANAGER'), validate(createBuildSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const build = await buildService.createBuild(req.body as never, req.user!.userId);
    res.status(201).json({ success: true, data: build });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/builds/:id ---
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const build = await buildService.getBuildById(Number(req.params.id));
    res.json({ success: true, data: build });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/builds/:id ---
const updateBuildSchema = {
  body: z.object({
    buildOrder: z.coerce.number().int().min(1).optional(),
    receivedDate: z.string().optional(),
    updateTarget: z.string().optional(),
    memo: z.string().optional(),
    version: z.number().int().min(0),
  }),
};

router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateBuildSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const build = await buildService.updateBuild(Number(req.params.id), req.body as never);
    res.json({ success: true, data: build });
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/builds/:id ---
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await buildService.deleteBuild(Number(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/builds/:id/status ---
const changeStatusSchema = {
  body: z.object({
    status: z.enum(['RECEIVED', 'TESTING', 'TEST_DONE', 'APPROVED', 'REJECTED', 'RELEASED']),
  }),
};

router.patch('/:id/status', authorize('ADMIN', 'MANAGER', 'MEMBER'), validate(changeStatusSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const build = await buildService.changeBuildStatus(
      Number(req.params.id),
      req.body.status as BuildStatus,
    );
    res.json({ success: true, data: build });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/builds/:id/versions ---
const addVersionSchema = {
  body: z.object({
    buildType: z.enum(['APP', 'CDN']),
    platform: z.enum(['iOS', 'AOS', 'PC']).optional(),
    cdnType: z.string().max(100).optional(),
    version: z.string().min(1).max(100),
    note: z.string().optional(),
  }),
};

router.post('/:id/versions', authorize('ADMIN', 'MANAGER'), validate(addVersionSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const version = await buildService.addBuildVersion(Number(req.params.id), req.body as never);
    res.status(201).json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/builds/:id/versions/:vid ---
const updateVersionSchema = {
  body: z.object({
    buildType: z.enum(['APP', 'CDN']).optional(),
    platform: z.enum(['iOS', 'AOS', 'PC']).optional(),
    cdnType: z.string().max(100).optional(),
    version: z.string().min(1).max(100).optional(),
    note: z.string().optional(),
  }),
};

router.put('/:id/versions/:vid', authorize('ADMIN', 'MANAGER'), validate(updateVersionSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const version = await buildService.updateBuildVersion(
      Number(req.params.id),
      Number(req.params.vid),
      req.body as never,
    );
    res.json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/builds/:id/versions/:vid ---
router.delete('/:id/versions/:vid', authorize('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await buildService.deleteBuildVersion(
      Number(req.params.id),
      Number(req.params.vid),
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/builds/:id/tasks ---
const linkTasksSchema = {
  body: z.object({
    taskIds: z.array(z.coerce.number().int().min(1)).min(1),
  }),
};

router.post('/:id/tasks', authorize('ADMIN', 'MANAGER', 'MEMBER'), validate(linkTasksSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const links = await buildService.linkTasks(
      Number(req.params.id),
      req.body.taskIds,
      req.user!.userId,
    );
    res.status(201).json({ success: true, data: links });
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/builds/:id/tasks/:taskId ---
router.delete('/:id/tasks/:taskId', authorize('ADMIN', 'MANAGER', 'MEMBER'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await buildService.unlinkTask(
      Number(req.params.id),
      Number(req.params.taskId),
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
