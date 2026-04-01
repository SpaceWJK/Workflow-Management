// ============================================================
// 인증 서비스
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { JWT_SECRET } from '../middleware/auth.js';
import type { JwtPayload } from '../types/index.js';
import { UnauthorizedError, AppError, ForbiddenError } from '../types/index.js';
import { sendVerificationEmail } from './email.service.js';

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is not set. Server cannot start without it.');
}
const REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 12;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult extends TokenPair {
  token: string; // accessToken alias (클라이언트 호환)
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * 로그인: email/password 검증, Access Token + Refresh Token 발급.
 */
export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as JwtPayload['role'],
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/**
 * 이름 기반 로그인: name/password 검증, Access Token + Refresh Token 발급.
 */
export async function loginByName(name: string, password: string): Promise<LoginResult> {
  // isActive 조건 없이 먼저 찾아서 승인대기/비활성 분기 처리
  const user = await prisma.user.findFirst({
    where: { name },
  });

  if (!user) {
    throw new UnauthorizedError('이름 또는 비밀번호가 올바르지 않습니다.');
  }

  if (!user.isActive) {
    throw new AppError(403, '가입 승인 대기 중입니다. 관리자 승인 후 로그인할 수 있습니다.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('이름 또는 비밀번호가 올바르지 않습니다.');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role as JwtPayload['role'],
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return {
    token: accessToken,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/**
 * 단순 회원가입: 이메일 인증 없이 이름/이메일/비밀번호로 가입.
 */
export async function signupSimple(
  name: string,
  email: string,
  password: string,
): Promise<{ id: number; email: string; name: string; role: string }> {
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new AppError(400, '이미 사용 중인 이메일입니다.');
  }

  const existingName = await prisma.user.findFirst({ where: { name } });
  if (existingName) {
    throw new AppError(400, '이미 사용 중인 이름입니다.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { email, passwordHash, name, role: 'QA_MEMBER', isActive: false },
  });

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

/**
 * Refresh Token 검증 -> 새 Access Token 발급.
 */
export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;

    // DB에서 유저 존재/활성 확인
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or deactivated');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });

    return { accessToken };
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

/**
 * 회원 등록: ADMIN만 호출 가능.
 */
export async function register(
  callerRole: string,
  data: { email: string; password: string; name: string; role?: string },
): Promise<{ id: number; email: string; name: string; role: string }> {
  if (callerRole !== 'ADMIN') {
    throw new ForbiddenError('Only ADMIN can register new users');
  }

  // 이메일 중복 확인
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new AppError(400, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role || 'MEMBER',
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

// ============================================================
// 회원가입 + 이메일 인증
// ============================================================

/**
 * 6자리 숫자 인증코드 생성.
 */
function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
}

/**
 * 인증코드 발송: 6자리 랜덤 코드 생성, DB 저장, 이메일 발송.
 * - 이미 가입된 이메일이면 에러
 * - 1분 내 재요청 방지 (rate limit)
 * - 코드 유효기간: 10분
 */
export async function sendVerificationCode(email: string): Promise<void> {
  // 이미 가입된 이메일 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(400, '이미 가입된 이메일입니다.');
  }

  // 1분 내 재요청 방지
  const recentRecord = await prisma.emailVerification.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' },
  });

  if (recentRecord) {
    const elapsed = Date.now() - recentRecord.createdAt.getTime();
    if (elapsed < 60_000) {
      throw new AppError(429, '인증코드 재발송은 1분 후에 가능합니다.');
    }
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분

  await prisma.emailVerification.create({
    data: { email, code, expiresAt },
  });

  await sendVerificationEmail(email, code);
}

/**
 * 인증코드 검증: 코드 일치 + 만료 확인 후 verified = true 처리.
 */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const record = await prisma.emailVerification.findFirst({
    where: { email, code, verified: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw new AppError(400, '유효하지 않은 인증코드입니다.');
  }

  if (record.expiresAt < new Date()) {
    throw new AppError(400, '만료된 인증코드입니다. 새 코드를 요청해주세요.');
  }

  await prisma.emailVerification.updateMany({
    where: { id: record.id },
    data: { verified: true },
  });
}

/**
 * 셀프 회원가입: 이메일 인증 완료 후 계정 생성.
 * - verified된 인증 기록 필수
 * - 비밀번호 bcrypt 해시
 * - 기본 role: QA_MEMBER
 * - 가입 완료 후 인증 기록 삭제
 */
export async function signup(
  name: string,
  email: string,
  password: string,
  code: string,
): Promise<{ id: number; email: string; name: string; role: string }> {
  // 인증 기록 확인
  const verification = await prisma.emailVerification.findFirst({
    where: { email, code, verified: true },
  });

  if (!verification) {
    throw new AppError(400, '이메일 인증이 완료되지 않았습니다.');
  }

  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(400, '이미 가입된 이메일입니다.');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'QA_MEMBER',
    },
  });

  // 인증 기록 삭제
  await prisma.emailVerification.deleteMany({ where: { email } });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
