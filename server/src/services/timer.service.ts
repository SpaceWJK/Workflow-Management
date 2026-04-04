// ============================================================
// Timer 서비스 — TaskTimeLog 기반 시간 추적
// ============================================================

import prisma from '../prisma.js';
import { NotFoundError, AppError } from '../types/index.js';
import {
  emitTimerStarted,
  emitTimerStopped,
} from './notification.service.js';

// --- 내부 헬퍼: 특정 사용자의 진행 중 타이머 정지 ---

export async function stopActiveTimerForUser(userId: number): Promise<void> {
  const activeLog = await prisma.taskTimeLog.findFirst({
    where: { userId, stoppedAt: null },
  });

  if (!activeLog) return;

  const now = new Date();
  const duration = Math.floor((now.getTime() - activeLog.startedAt.getTime()) / 1000);

  await prisma.taskTimeLog.update({
    where: { id: activeLog.id },
    data: { stoppedAt: now, duration },
  });

  emitTimerStopped(activeLog.taskId, userId, activeLog.id, duration);
}

// --- 내부 헬퍼: Task의 진행 중 타이머 정지 (Task DONE/CANCELED 시 호출) ---

export async function stopTimerByTaskId(taskId: number): Promise<void> {
  const activeLog = await prisma.taskTimeLog.findFirst({
    where: { taskId, stoppedAt: null },
  });

  if (!activeLog) return;

  const now = new Date();
  const duration = Math.floor((now.getTime() - activeLog.startedAt.getTime()) / 1000);

  await prisma.taskTimeLog.update({
    where: { id: activeLog.id },
    data: { stoppedAt: now, duration },
  });

  emitTimerStopped(taskId, activeLog.userId, activeLog.id, duration);
}

// --- 타이머 시작 ---

export async function startTimer(taskId: number, userId: number) {
  // 1. Task 존재 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, isDeleted: false } });
  if (!task) throw new NotFoundError('Task');

  // 2. 동일 Task에 다른 사용자의 진행 중 타이머 확인 (1 Task = 1 active timer)
  const otherActiveLog = await prisma.taskTimeLog.findFirst({
    where: { taskId, stoppedAt: null, userId: { not: userId } },
  });
  if (otherActiveLog) {
    throw new AppError(409, '다른 사용자가 이 일감의 타이머를 진행 중입니다.');
  }

  // 3. 이미 해당 사용자의 이 Task 타이머가 진행 중이면 409
  const myActiveLog = await prisma.taskTimeLog.findFirst({
    where: { taskId, userId, stoppedAt: null },
  });
  if (myActiveLog) {
    throw new AppError(409, '이미 이 일감의 타이머가 진행 중입니다.');
  }

  // 4. 복수 타이머 허용 — 다른 Task 타이머 자동 정지 안 함

  // 5. 새 타이머 생성
  const log = await prisma.taskTimeLog.create({
    data: { taskId, userId },
  });

  // 6. Task가 PENDING이면 IN_PROGRESS 자동 전환 + 빌드 연동
  if (task.status === 'PENDING') {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS', version: { increment: 1 }, updatedAt: new Date() },
    });

    // 연결 빌드 RECEIVED → TESTING 자동 전환
    const buildLinks = await prisma.taskBuildLink.findMany({
      where: { taskId, build: { isDeleted: false, status: 'RECEIVED' } },
      include: { build: { select: { id: true } } },
    });
    for (const link of buildLinks) {
      await prisma.build.update({
        where: { id: link.build.id },
        data: { status: 'TESTING', version: { increment: 1 }, updatedAt: new Date() },
      });
    }
  }

  emitTimerStarted(taskId, userId, log.id);

  return log;
}

// --- 타이머 정지 ---

export async function stopTimer(taskId: number, userId: number) {
  // Task 존재 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, isDeleted: false } });
  if (!task) throw new NotFoundError('Task');

  // 해당 Task + 해당 User의 진행 중 타이머 검색 (타인 타이머 정지 방지)
  const activeLog = await prisma.taskTimeLog.findFirst({
    where: { taskId, userId, stoppedAt: null },
  });
  if (!activeLog) {
    throw new AppError(404, '진행 중인 타이머가 없습니다.');
  }

  const now = new Date();
  const duration = Math.floor((now.getTime() - activeLog.startedAt.getTime()) / 1000);

  const updatedLog = await prisma.taskTimeLog.update({
    where: { id: activeLog.id },
    data: { stoppedAt: now, duration },
  });

  emitTimerStopped(taskId, userId, updatedLog.id, duration);

  return updatedLog;
}

// --- 타이머 상태 조회 ---

export async function getTimerStatus(taskId: number) {
  // Task 존재 확인
  const task = await prisma.task.findFirst({ where: { id: taskId, isDeleted: false } });
  if (!task) throw new NotFoundError('Task');

  // 진행 중 타이머
  const activeLog = await prisma.taskTimeLog.findFirst({
    where: { taskId, stoppedAt: null },
    include: { user: { select: { id: true, name: true } } },
  });

  // 전체 로그 목록
  const logs = await prisma.taskTimeLog.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { startedAt: 'desc' },
  });

  // 완료된 로그의 총 초 합산
  const totalSeconds = logs.reduce((sum, log) => {
    return sum + (log.duration ?? 0);
  }, 0);

  // 진행 중 elapsed 계산
  const elapsed = activeLog
    ? Math.floor((Date.now() - activeLog.startedAt.getTime()) / 1000)
    : null;

  return {
    isRunning: !!activeLog,
    currentLog: activeLog ? { ...activeLog, elapsed } : null,
    logs,
    totalSeconds,
  };
}
