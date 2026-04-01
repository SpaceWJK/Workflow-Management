// ============================================================
// Settings 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../prisma.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { NotFoundError } from '../types/index.js';

const router = Router();

router.use(authenticate);

// --- GET /api/settings ---
// ADMIN/MANAGER만 전체 설정 조회 가능
router.get(
  '/',
  authorize('ADMIN', 'MANAGER'),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const settings = await prisma.setting.findMany({
        orderBy: { key: 'asc' },
      });

      // key-value 객체로 변환
      const settingsMap = settings.reduce(
        (acc: Record<string, string>, s: { key: string; value: string }) => {
          acc[s.key] = s.value;
          return acc;
        },
        {} as Record<string, string>,
      );

      res.json({ success: true, data: settingsMap });
    } catch (err) {
      next(err);
    }
  },
);

// --- GET /api/settings/:key ---
router.get('/:key', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key as string },
    });

    if (!setting) throw new NotFoundError(`Setting '${req.params.key as string}'`);

    res.json({ success: true, data: { key: setting.key, value: setting.value } });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/settings/:key ---
const updateSettingSchema = {
  body: z.object({
    value: z.string().min(1, 'Value is required'),
  }),
};

router.put(
  '/:key',
  authorize('ADMIN'),
  validate(updateSettingSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const setting = await prisma.setting.upsert({
        where: { key: req.params.key as string },
        update: { value: req.body.value, updatedAt: new Date() },
        create: { key: req.params.key as string, value: req.body.value },
      });

      res.json({ success: true, data: { key: setting.key, value: setting.value } });
    } catch (err) {
      next(err);
    }
  },
);

// --- POST /api/settings (bulk upsert) ---
const bulkUpdateSchema = {
  body: z.object({
    settings: z.record(z.string(), z.string()),
  }),
};

router.post(
  '/',
  authorize('ADMIN'),
  validate(bulkUpdateSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const entries = Object.entries(req.body.settings as Record<string, string>);

      await prisma.$transaction(
        entries.map(([key, value]) =>
          prisma.setting.upsert({
            where: { key },
            update: { value, updatedAt: new Date() },
            create: { key, value },
          }),
        ),
      );

      res.json({ success: true, data: { updated: entries.length } });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
