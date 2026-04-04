// ============================================================
// Tasks 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as taskService from '../services/task.service.js';
import type { AuthenticatedRequest, TaskStatus } from '../types/index.js';

const router = Router();

// 모든 Task 라우트에 인증 필요
router.use(authenticate);

// --- GET /api/tasks ---
const getTasksSchema = {
  query: z.object({
    projectId: z.coerce.number().int().optional(),
    assigneeId: z.coerce.number().int().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    testType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    keyword: z.string().optional(),
    search: z.string().optional(), // keyword alias
    page: z.coerce.number().int().positive().optional().default(1),
    size: z.coerce.number().int().positive().max(100).optional().default(20),
    sortBy: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};

router.get('/', validate(getTasksSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // search 파라미터를 keyword로 통합
    const query = req.query as Record<string, unknown>;
    if (query.search && !query.keyword) {
      query.keyword = query.search;
    }
    delete query.search;
    const result = await taskService.getTasks(query as never);
    res.json({ success: true, data: result.tasks, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/tasks/risk ---
router.get('/risk', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const tasks = await taskService.getRiskTasks(projectId);
    res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/tasks ---
const createTaskSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    projectId: z.coerce.number().int().min(1, 'Project ID is required'),
    assigneeId: z.coerce.number().int().optional(),
    assigneeName: z.string().max(100).optional(),
    status: z.enum([
      'PENDING', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCELED',
    ]).optional(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NORMAL', 'URGENT']).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    progressTotal: z.coerce.number().min(0).max(100).optional(),
    testTypes: z.array(z.object({
      testTypeCode: z.string(),
      progress: z.coerce.number().min(0).max(100).optional(),
      note: z.string().optional(),
    })).optional(),
  }),
};

router.post('/', validate(createTaskSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.createTask(req.body as never, req.user!.userId);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/tasks/:id ---
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.getTaskById(Number(req.params.id));
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/tasks/:id ---
const updateTaskSchema = {
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    assigneeId: z.coerce.number().int().optional(),
    assigneeName: z.string().max(100).optional(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NORMAL', 'URGENT']).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    progressTotal: z.coerce.number().min(0).max(100).optional(),
    memo: z.string().optional(),
    testTypes: z.array(z.object({
      id: z.coerce.number().int().optional(),
      testTypeCode: z.string(),
      progress: z.coerce.number().min(0).max(100).optional(),
      note: z.string().optional(),
    })).optional(),
    version: z.number().int().min(0, 'Version is required for optimistic locking'),
  }),
};

router.put('/:id', validate(updateTaskSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.updateTask(Number(req.params.id), req.body as never);
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/tasks/:id ---
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await taskService.deleteTask(Number(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/tasks/:id/status ---
const changeStatusSchema = {
  body: z.object({
    status: z.enum([
      'PENDING', 'IN_PROGRESS', 'ON_HOLD', 'DONE', 'CANCELED',
    ]),
  }),
};

router.patch('/:id/status', validate(changeStatusSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await taskService.changeTaskStatus(
      Number(req.params.id),
      req.body.status as TaskStatus,
      req.user!.userId,
      req.user!.role,
    );
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/tasks/:id/progress ---
const updateProgressSchema = {
  body: z.object({
    testTypeId: z.coerce.number().int().min(1, 'TestType ID is required'),
    progress: z.number().int().min(0).max(100),
  }),
};

router.patch('/:id/progress', validate(updateProgressSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await taskService.updateTaskProgress(
      Number(req.params.id),
      req.body as never,
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/tasks/:id/history ---
router.get('/:id/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = await taskService.getTaskHistory(Number(req.params.id));
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});

export default router;
