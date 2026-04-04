// ============================================================
// CalendarEvents 라우트 — /api/calendar/events
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import * as calendarEventService from '../services/calendar-event.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError } from '../types/index.js';

const router = Router();

function parseId(raw: string): number {
  const id = parseInt(raw, 10);
  if (isNaN(id) || id < 1) throw new AppError(400, 'Invalid event ID');
  return id;
}

// 모든 라우트에 인증 필요
router.use(authenticate);

// --- GET /api/calendar/events?startDate=&endDate=&userId= ---
const getEventsSchema = {
  query: z.object({
    startDate: z.string().min(1, 'startDate is required'),
    endDate:   z.string().min(1, 'endDate is required'),
    userId:    z.coerce.number().int().optional(),
  }),
};

router.get('/', validate(getEventsSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const startDate = String(req.query.startDate);
    const endDate   = String(req.query.endDate);
    const userIdRaw = req.query.userId;
    const userId    = userIdRaw !== undefined ? Number(userIdRaw) : undefined;
    const events = await calendarEventService.getEvents(startDate, endDate, userId);
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/calendar/events ---
const createEventSchema = {
  body: z.object({
    title:     z.string().min(1, 'Title is required').max(200),
    type:      z.enum(['VACATION', 'BUSINESS_TRIP', 'HALF_DAY_AM', 'HALF_DAY_PM', 'REMOTE', 'MEETING', 'OTHER']),
    startDate: z.string().min(1, 'startDate is required'),
    endDate:   z.string().min(1, 'endDate is required'),
    allDay:    z.boolean().optional(),
    memo:      z.string().optional(),
  }),
};

router.post('/', validate(createEventSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const event = await calendarEventService.createEvent(req.body as never, req.user!.userId);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/calendar/events/:id ---
const updateEventSchema = {
  body: z.object({
    title:     z.string().min(1).max(200).optional(),
    type:      z.enum(['VACATION', 'BUSINESS_TRIP', 'HALF_DAY_AM', 'HALF_DAY_PM', 'REMOTE', 'MEETING', 'OTHER']).optional(),
    startDate: z.string().optional(),
    endDate:   z.string().optional(),
    allDay:    z.boolean().optional(),
    memo:      z.string().optional(),
  }),
};

router.put('/:id', validate(updateEventSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const event = await calendarEventService.updateEvent(
      parseId(String(req.params.id)),
      req.body as never,
      req.user!.userId,
    );
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/calendar/events/:id ---
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await calendarEventService.deleteEvent(
      parseId(String(req.params.id)),
      req.user!.userId,
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
