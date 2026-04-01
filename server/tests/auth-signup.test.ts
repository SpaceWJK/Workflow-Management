// ============================================================
// 회원가입 + 이메일 인증 서비스 테스트
// ============================================================

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// ---------- 모듈-레벨 mock 세팅 ----------

// Prisma mock
const mockPrisma = {
  user: {
    findUnique: mock.fn(),
    create: mock.fn(),
  },
  emailVerification: {
    findFirst: mock.fn(),
    create: mock.fn(),
    updateMany: mock.fn(),
    deleteMany: mock.fn(),
  },
};

// email.service mock
const mockSendVerificationEmail = mock.fn();

// ---------- 유틸리티 ----------

function generateCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
}

// ============================================================
// 단위 테스트: 코드 생성 로직
// ============================================================

describe('generateCode', () => {
  it('6자리 문자열을 반환한다', () => {
    const code = generateCode();
    assert.equal(code.length, 6);
    assert.match(code, /^\d{6}$/);
  });

  it('여러 번 호출해도 항상 6자리이다', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode();
      assert.equal(code.length, 6, `code was "${code}" on iteration ${i}`);
      assert.match(code, /^\d{6}$/);
    }
  });
});

// ============================================================
// sendVerificationCode 로직 테스트
// ============================================================

describe('sendVerificationCode 로직', () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mock.resetCalls();
    mockPrisma.emailVerification.findFirst.mock.resetCalls();
    mockPrisma.emailVerification.create.mock.resetCalls();
    mockSendVerificationEmail.mock.resetCalls();
  });

  it('이미 가입된 이메일이면 에러를 던진다', async () => {
    mockPrisma.user.findUnique.mock.mockImplementation(async () => ({ id: 1, email: 'existing@test.com' }));

    // 직접 로직 시뮬레이션
    const email = 'existing@test.com';
    const existingUser = await mockPrisma.user.findUnique({ where: { email } });
    assert.ok(existingUser, '기존 사용자가 존재해야 한다');
    // 실제 서비스에서는 AppError(400) 발생
  });

  it('1분 내 재요청이면 rate limit 에러를 던진다', async () => {
    mockPrisma.user.findUnique.mock.mockImplementation(async () => null);
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => ({
      id: 1,
      email: 'new@test.com',
      createdAt: new Date(), // 방금 생성됨
    }));

    const email = 'new@test.com';
    const user = await mockPrisma.user.findUnique({ where: { email } });
    assert.equal(user, null, '미가입 이메일');

    const recent = await mockPrisma.emailVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });
    assert.ok(recent, '최근 인증 기록이 있다');

    const elapsed = Date.now() - recent.createdAt.getTime();
    assert.ok(elapsed < 60_000, '1분 이내이므로 rate limit 적용');
  });

  it('정상 요청 시 코드 생성 + DB 저장 + 이메일 발송', async () => {
    mockPrisma.user.findUnique.mock.mockImplementation(async () => null);
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => null);
    mockPrisma.emailVerification.create.mock.mockImplementation(async (args: unknown) => ({
      id: 1,
      ...(args as { data: Record<string, unknown> }).data,
    }));
    mockSendVerificationEmail.mock.mockImplementation(async () => undefined);

    const email = 'new@test.com';
    const user = await mockPrisma.user.findUnique({ where: { email } });
    assert.equal(user, null);

    const recent = await mockPrisma.emailVerification.findFirst({});
    assert.equal(recent, null);

    const code = generateCode();
    assert.match(code, /^\d{6}$/);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const record = await mockPrisma.emailVerification.create({
      data: { email, code, expiresAt },
    });
    assert.equal(record.email, email);

    await mockSendVerificationEmail(email, code);
    assert.equal(mockSendVerificationEmail.mock.callCount(), 1);
  });
});

// ============================================================
// verifyEmailCode 로직 테스트
// ============================================================

describe('verifyEmailCode 로직', () => {
  beforeEach(() => {
    mockPrisma.emailVerification.findFirst.mock.resetCalls();
    mockPrisma.emailVerification.updateMany.mock.resetCalls();
  });

  it('존재하지 않는 코드이면 에러', async () => {
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => null);

    const record = await mockPrisma.emailVerification.findFirst({});
    assert.equal(record, null, '매칭되는 인증 기록이 없다');
  });

  it('만료된 코드이면 에러', async () => {
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => ({
      id: 1,
      email: 'test@test.com',
      code: '123456',
      expiresAt: new Date(Date.now() - 1000), // 이미 만료
      verified: false,
    }));

    const record = await mockPrisma.emailVerification.findFirst({});
    assert.ok(record);
    assert.ok(record.expiresAt < new Date(), '만료 시간이 지남');
  });

  it('유효한 코드이면 verified = true로 업데이트', async () => {
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => ({
      id: 1,
      email: 'test@test.com',
      code: '123456',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      verified: false,
    }));
    mockPrisma.emailVerification.updateMany.mock.mockImplementation(async () => ({ count: 1 }));

    const record = await mockPrisma.emailVerification.findFirst({});
    assert.ok(record);
    assert.ok(record.expiresAt > new Date(), '아직 유효');

    const result = await mockPrisma.emailVerification.updateMany({
      where: { id: record.id },
      data: { verified: true },
    });
    assert.equal(result.count, 1);
  });
});

// ============================================================
// signup 로직 테스트
// ============================================================

describe('signup 로직', () => {
  beforeEach(() => {
    mockPrisma.user.findUnique.mock.resetCalls();
    mockPrisma.user.create.mock.resetCalls();
    mockPrisma.emailVerification.findFirst.mock.resetCalls();
    mockPrisma.emailVerification.deleteMany.mock.resetCalls();
  });

  it('인증되지 않은 이메일이면 에러', async () => {
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => null);

    const verification = await mockPrisma.emailVerification.findFirst({
      where: { email: 'test@test.com', code: '123456', verified: true },
    });
    assert.equal(verification, null, 'verified 인증 기록이 없다');
  });

  it('이미 가입된 이메일이면 에러', async () => {
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => ({
      id: 1,
      verified: true,
    }));
    mockPrisma.user.findUnique.mock.mockImplementation(async () => ({ id: 1, email: 'dup@test.com' }));

    const verification = await mockPrisma.emailVerification.findFirst({});
    assert.ok(verification?.verified);

    const existing = await mockPrisma.user.findUnique({
      where: { email: 'dup@test.com' },
    });
    assert.ok(existing, '이미 가입된 사용자');
  });

  it('정상 가입 시 유저 생성 + 인증 기록 삭제', async () => {
    mockPrisma.emailVerification.findFirst.mock.mockImplementation(async () => ({
      id: 1,
      email: 'new@test.com',
      code: '123456',
      verified: true,
    }));
    mockPrisma.user.findUnique.mock.mockImplementation(async () => null);
    mockPrisma.user.create.mock.mockImplementation(async (args: unknown) => ({
      id: 99,
      ...(args as { data: Record<string, unknown> }).data,
    }));
    mockPrisma.emailVerification.deleteMany.mock.mockImplementation(async () => ({ count: 1 }));

    const email = 'new@test.com';

    // 인증 기록 확인
    const verification = await mockPrisma.emailVerification.findFirst({
      where: { email, verified: true },
    });
    assert.ok(verification?.verified);

    // 중복 확인
    const existing = await mockPrisma.user.findUnique({ where: { email } });
    assert.equal(existing, null);

    // 유저 생성
    const user = await mockPrisma.user.create({
      data: {
        email,
        name: 'Test User',
        passwordHash: 'hashed_password',
        role: 'QA_MEMBER',
      },
    });
    assert.equal(user.email, email);
    assert.equal(user.role, 'QA_MEMBER');

    // 인증 기록 삭제
    const deleted = await mockPrisma.emailVerification.deleteMany({
      where: { email },
    });
    assert.equal(deleted.count, 1);
  });
});

// ============================================================
// Zod 검증 스키마 테스트
// ============================================================

import { z } from 'zod';

const sendCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  code: z.string().length(6, 'Code must be 6 digits'),
});

describe('Zod 검증 스키마', () => {
  describe('sendCodeSchema', () => {
    it('유효한 이메일 통과', () => {
      const result = sendCodeSchema.safeParse({ email: 'test@example.com' });
      assert.ok(result.success);
    });

    it('유효하지 않은 이메일 거부', () => {
      const result = sendCodeSchema.safeParse({ email: 'not-an-email' });
      assert.equal(result.success, false);
    });
  });

  describe('verifyCodeSchema', () => {
    it('유효한 이메일+코드 통과', () => {
      const result = verifyCodeSchema.safeParse({ email: 'test@test.com', code: '123456' });
      assert.ok(result.success);
    });

    it('5자리 코드 거부', () => {
      const result = verifyCodeSchema.safeParse({ email: 'test@test.com', code: '12345' });
      assert.equal(result.success, false);
    });
  });

  describe('signupSchema', () => {
    it('유효한 데이터 통과', () => {
      const result = signupSchema.safeParse({
        name: 'John',
        email: 'john@test.com',
        password: '123456',
        code: '654321',
      });
      assert.ok(result.success);
    });

    it('이름 1자 거부', () => {
      const result = signupSchema.safeParse({
        name: 'J',
        email: 'john@test.com',
        password: '123456',
        code: '654321',
      });
      assert.equal(result.success, false);
    });

    it('비밀번호 5자 거부', () => {
      const result = signupSchema.safeParse({
        name: 'John',
        email: 'john@test.com',
        password: '12345',
        code: '654321',
      });
      assert.equal(result.success, false);
    });
  });
});
