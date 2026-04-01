// ============================================================
// Admin 라우트 — 회원관리 (ADMIN 전용)
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import prisma from '../prisma.js';
import bcrypt from 'bcryptjs';
import type { AuthenticatedRequest } from '../types/index.js';
import { AppError, NotFoundError } from '../types/index.js';

const router = Router();

// 모든 라우트에 ADMIN 인증 필수
router.use(authenticate, authorize('ADMIN'));

// --- GET /api/admin/users — 전체 사용자 목록 (활성/비활성 모두) ---
router.get('/users', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamStatus: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            assignedTasks: { where: { isDeleted: false, status: { notIn: ['DONE', 'CANCELED'] } } },
          },
        },
      },
      orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/admin/users/:id/approve — 가입 승인 ---
router.patch('/users/:id/approve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');
    if (user.isActive) throw new AppError(400, '이미 활성화된 사용자입니다.');

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/admin/users/:id/reject — 가입 거절 (삭제) ---
router.delete('/users/:id/reject', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');
    if (user.isActive) throw new AppError(400, '활성 사용자는 거절할 수 없습니다. 비활성화를 사용해주세요.');

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: '가입 요청이 거절되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/admin/users/:id/role — 역할 변경 ---
const roleSchema = {
  body: z.object({
    role: z.enum(['ADMIN', 'QA_MANAGER', 'QA_MEMBER', 'VIEWER']),
  }),
};

router.patch('/users/:id/role', validate(roleSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    // 자기 자신의 역할 변경 방지
    if (req.user!.userId === id) {
      throw new AppError(400, '자신의 역할은 변경할 수 없습니다.');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/admin/users/:id/deactivate — 비활성화/활성화 토글 ---
router.patch('/users/:id/deactivate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    if (req.user!.userId === id) {
      throw new AppError(400, '자신의 계정은 비활성화할 수 없습니다.');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// --- PATCH /api/admin/users/:id/reset-password — 비밀번호 초기화 ---
const resetPasswordSchema = {
  body: z.object({
    newPassword: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  }),
};

router.patch('/users/:id/reset-password', validate(resetPasswordSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const { newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({ success: true, message: '비밀번호가 초기화되었습니다.' });
  } catch (err) {
    next(err);
  }
});

export default router;
