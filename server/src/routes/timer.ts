// ============================================================
// Timer 라우트 — /api/tasks/:taskId/timer/*
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as timerService from '../services/timer.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// 모든 타이머 라우트에 인증 필요
router.use(authenticate);

// --- POST /api/tasks/:taskId/timer/start ---
router.post('/:taskId/timer/start', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = parseInt(String(req.params.taskId), 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'taskId must be a valid integer' });
    }
    const log = await timerService.startTimer(taskId, req.user!.userId);
    res.status(201).json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/tasks/:taskId/timer/stop ---
router.post('/:taskId/timer/stop', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = parseInt(String(req.params.taskId), 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'taskId must be a valid integer' });
    }
    const log = await timerService.stopTimer(taskId, req.user!.userId);
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/tasks/:taskId/timer ---
router.get('/:taskId/timer', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const taskId = parseInt(String(req.params.taskId), 10);
    if (isNaN(taskId)) {
      return res.status(400).json({ success: false, message: 'taskId must be a valid integer' });
    }
    const status = await timerService.getTimerStatus(taskId);
    res.json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
});

export default router;
