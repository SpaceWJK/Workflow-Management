// ============================================================
// 위험도 / Velocity 계산 서비스
// ============================================================

import type { RiskLevel, TaskStatus } from '../types/index.js';

/** 위험도 판단에서 무시하는 상태 (M-4) */
const SKIP_STATUSES: TaskStatus[] = ['DONE', 'CANCELED'];

/** 허용 오차 (%) */
const TOLERANCE_PERCENT = 10;

/** CRITICAL 판단 기준: 마감 N일 이내 */
const CRITICAL_DAYS_THRESHOLD = 3;

/** CRITICAL 판단 기준: 진행률 하한 (%) */
const CRITICAL_PROGRESS_THRESHOLD = 70;

interface RiskInput {
  status: TaskStatus;
  startDate: Date | string;
  dueDate: Date | string;
  progress: number;      // 0~100
  testTypeCount: number; // 등록된 testType 수
}

interface RiskResult {
  riskLevel: RiskLevel;
  expectedProgress: number;
  gap: number;
  requiredVelocity: number | null;
  daysRemaining: number;
}

/**
 * 기대 진행률 계산.
 * - totalDays === 0 이면 expected = 100 (C-3 수정)
 * - 오늘이 dueDate 이후이면 expected = 100
 */
export function calculateExpectedProgress(startDate: Date, dueDate: Date, now: Date = new Date()): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const totalDays = Math.floor((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // C-3: totalDays가 0이면 기대 진행률 100%
  if (totalDays <= 0) return 100;

  // 마감일 지남
  if (elapsedDays >= totalDays) return 100;

  // 시작 전
  if (elapsedDays <= 0) return 0;

  return Math.round((elapsedDays / totalDays) * 100);
}

/**
 * 남은 기간 대비 필요 일일 진행률 (Velocity).
 * daysRemaining <= 0이면 null (이미 마감).
 */
export function calculateRequiredVelocity(
  currentProgress: number,
  daysRemaining: number,
): number | null {
  if (daysRemaining <= 0) return null;
  const remaining = 100 - currentProgress;
  if (remaining <= 0) return 0;
  return Math.round((remaining / daysRemaining) * 100) / 100;
}

/**
 * 남은 일수 계산.
 */
export function calculateDaysRemaining(dueDate: Date, now: Date = new Date()): number {
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 위험도 수준 판단.
 * - DONE/CANCELED 상태는 NONE (M-4)
 * - testTypeCount === 0이면 progress = 0 (C-4)
 * - 마감 3일 이내 + 진행률 < 70% -> CRITICAL
 * - gap > 30% -> CRITICAL
 * - gap > 20% -> HIGH
 * - gap > tolerance(10%) -> MEDIUM
 * - 그 외 -> LOW 또는 NONE
 */
export function assessRisk(input: RiskInput): RiskResult {
  const { status, startDate, dueDate, testTypeCount } = input;
  let { progress } = input;

  // M-4: DONE/CANCELED 상태는 skip
  if (SKIP_STATUSES.includes(status)) {
    return {
      riskLevel: 'NONE',
      expectedProgress: status === 'DONE' ? 100 : 0,
      gap: 0,
      requiredVelocity: null,
      daysRemaining: 0,
    };
  }

  // C-4: testType이 0개이면 progress 강제 0
  if (testTypeCount === 0) {
    progress = 0;
  }

  const start = new Date(startDate);
  const due = new Date(dueDate);
  const now = new Date();

  const expectedProgress = calculateExpectedProgress(start, due, now);
  const daysRemaining = calculateDaysRemaining(due, now);
  const gap = expectedProgress - progress;
  const requiredVelocity = calculateRequiredVelocity(progress, daysRemaining);

  let riskLevel: RiskLevel;

  // 마감 3일 이내 + 진행률 < 70% -> CRITICAL
  if (daysRemaining <= CRITICAL_DAYS_THRESHOLD && progress < CRITICAL_PROGRESS_THRESHOLD) {
    riskLevel = 'CRITICAL';
  } else if (gap > 30) {
    riskLevel = 'CRITICAL';
  } else if (gap > 20) {
    riskLevel = 'HIGH';
  } else if (gap > TOLERANCE_PERCENT) {
    riskLevel = 'MEDIUM';
  } else if (gap > 0) {
    riskLevel = 'LOW';
  } else {
    riskLevel = 'NONE';
  }

  return {
    riskLevel,
    expectedProgress,
    gap,
    requiredVelocity,
    daysRemaining,
  };
}
