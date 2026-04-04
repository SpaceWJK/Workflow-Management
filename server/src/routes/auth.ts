// ============================================================
// Auth 라우트
// ============================================================

import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as authService from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../types/index.js';

const router = Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5,                    // IP당 5회
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many refresh attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- POST /api/auth/login (이름 + 비밀번호) ---
const loginSchema = {
  body: z.object({
    name: z.string().min(1, '이름을 입력해주세요.'),
    password: z.string().min(1, '비밀번호를 입력해주세요.'),
  }),
};

router.post('/login', loginLimiter, validate(loginSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, password } = req.body;
    const result = await authService.loginByName(name, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/auth/refresh ---
const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

router.post('/refresh', refreshLimiter, validate(refreshSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/auth/register (ADMIN only) ---
const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'VIEWER']).optional(),
  }),
};

router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  validate(registerSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.user!.role, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
);

// --- POST /api/auth/send-code (인증코드 발송) ---
const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 3,                    // IP당 3회
  message: { success: false, message: '인증코드 요청이 너무 많습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sendCodeSchema = {
  body: z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  }),
};

router.post('/send-code', sendCodeLimiter, validate(sendCodeSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.sendVerificationCode(email);
    res.json({ success: true, message: '인증코드가 발송되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/auth/verify-code (인증코드 검증) ---
const verifyCodeSchema = {
  body: z.object({
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
    code: z.string().length(6, '인증코드는 6자리입니다.'),
  }),
};

router.post('/verify-code', validate(verifyCodeSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { email, code } = req.body;
    await authService.verifyEmailCode(email, code);
    res.json({ success: true, message: '이메일이 인증되었습니다.' });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/auth/signup (셀프 회원가입) ---
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5,                    // IP당 5회
  message: { success: false, message: '회원가입 요청이 너무 많습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const signupSchema = {
  body: z.object({
    name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.'),
    email: z.string().email('올바른 이메일 형식이 아닙니다.'),
    password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  }),
};

router.post('/signup', signupLimiter, validate(signupSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.signupSimple(name, email, password);
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/auth/me ---
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { default: prisma } = await import('../prisma.js');
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, teamStatus: true, team: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/auth/profile — 이름 변경 ---
const updateProfileSchema = {
  body: z.object({
    name: z.string().min(1, '이름은 최소 1자 이상이어야 합니다.').max(100),
  }),
};

router.put('/profile', authenticate, validate(updateProfileSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { default: prisma } = await import('../prisma.js');
    const updated = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name: req.body.name },
      select: { id: true, email: true, name: true, role: true, teamStatus: true, team: true },
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// --- PUT /api/auth/password — 비밀번호 변경 ---
import bcrypt from 'bcryptjs';

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword:     z.string().min(6, '새 비밀번호는 최소 6자 이상이어야 합니다.'),
  }),
};

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: '비밀번호 변경 요청이 너무 많습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.put('/password', authenticate, passwordChangeLimiter, validate(changePasswordSchema), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { default: prisma } = await import('../prisma.js');
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '현재 비밀번호가 올바르지 않습니다.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { passwordHash },
    });

    res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    next(err);
  }
});

export default router;
