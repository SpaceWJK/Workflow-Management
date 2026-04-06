// ============================================================
// Attendance 라우트 — 근태 관리
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as attendanceService from '../services/attendance.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/attendance/me/today — 오늘 출근 상태 확인 ---
router.get('/me/today', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await attendanceService.getMyTodayStatus(req.user!.userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/attendance/clock — 출퇴근 체크 ---
const clockSchema = {
  body: z.object({
    action: z.enum(['IN', 'OUT']),
  }),
};

router.post('/clock', validate(clockSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await attendanceService.clockInOut(req.user!.userId, req.body.action);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/attendance/daily — 일간 출퇴근 현황 ---
const dailySchema = {
  query: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    team: z.string().optional(),
    projectId: z.coerce.number().int().optional(),
  }),
};

router.get('/daily', validate(dailySchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const team = req.query.team as string | undefined;
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const result = await attendanceService.getDailyAttendance(date, { team, projectId });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/attendance/monthly — 월간 근무시간 ---
const monthlySchema = {
  query: z.object({
    year: z.coerce.number().int().min(2020).max(2100),
    month: z.coerce.number().int().min(1).max(12),
    team: z.string().optional(),
    projectId: z.coerce.number().int().optional(),
  }),
};

router.get('/monthly', validate(monthlySchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { year, month } = req.query as unknown as { year: number; month: number };
    const team = req.query.team as string | undefined;
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const result = await attendanceService.getMonthlyAttendance(Number(year), Number(month), { team, projectId });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/attendance/personal/:userId — 개인별 상세 ---
const personalSchema = {
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
};

router.get('/personal/:userId', validate(personalSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = Number(req.params.userId);
    if (isNaN(userId) || userId < 1) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    // IDOR 방어: 본인 또는 ADMIN/QA_MANAGER만 조회 가능
    const callerRole = req.user!.role;
    if (req.user!.userId !== userId && callerRole !== 'ADMIN' && callerRole !== 'QA_MANAGER') {
      return res.status(403).json({ success: false, message: '본인 또는 관리자만 조회할 수 있습니다.' });
    }
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    const result = await attendanceService.getPersonalAttendance(userId, startDate, endDate);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/attendance/project-hours — 프로젝트별 소요시간 ---
const projectHoursSchema = {
  query: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    projectId: z.coerce.number().int().optional(),
  }),
};

router.get('/project-hours', validate(projectHoursSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string; endDate: string };
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const result = await attendanceService.getProjectHours(startDate, endDate, projectId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
