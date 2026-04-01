// ============================================================
// risk.service 테스트
// ============================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateExpectedProgress,
  calculateRequiredVelocity,
  calculateDaysRemaining,
  assessRisk,
} from '../src/services/risk.service.js';

describe('calculateExpectedProgress', () => {
  it('totalDays === 0 이면 expected = 100 (C-3)', () => {
    const date = new Date('2026-04-01');
    const result = calculateExpectedProgress(date, date, date);
    assert.equal(result, 100);
  });

  it('시작 전이면 0%', () => {
    const start = new Date('2026-04-10');
    const due = new Date('2026-04-20');
    const now = new Date('2026-04-05');
    assert.equal(calculateExpectedProgress(start, due, now), 0);
  });

  it('마감일 지나면 100%', () => {
    const start = new Date('2026-03-01');
    const due = new Date('2026-03-10');
    const now = new Date('2026-04-01');
    assert.equal(calculateExpectedProgress(start, due, now), 100);
  });

  it('중간 시점에서 비례 계산', () => {
    const start = new Date('2026-04-01');
    const due = new Date('2026-04-11'); // 10일
    const now = new Date('2026-04-06'); // 5일 경과
    assert.equal(calculateExpectedProgress(start, due, now), 50);
  });
});

describe('calculateRequiredVelocity', () => {
  it('daysRemaining <= 0 이면 null', () => {
    assert.equal(calculateRequiredVelocity(50, 0), null);
    assert.equal(calculateRequiredVelocity(50, -1), null);
  });

  it('이미 100%면 0', () => {
    assert.equal(calculateRequiredVelocity(100, 5), 0);
  });

  it('남은 진행률 / 남은 일수', () => {
    // 60% 완료, 8일 남음 -> (100-60)/8 = 5.0
    assert.equal(calculateRequiredVelocity(60, 8), 5);
  });
});

describe('calculateDaysRemaining', () => {
  it('마감일이 오늘이면 0', () => {
    const date = new Date('2026-04-01');
    assert.equal(calculateDaysRemaining(date, date), 0);
  });

  it('마감일이 미래면 양수', () => {
    const due = new Date('2026-04-11');
    const now = new Date('2026-04-01');
    assert.equal(calculateDaysRemaining(due, now), 10);
  });
});

describe('assessRisk', () => {
  it('DONE 상태는 NONE (M-4)', () => {
    const result = assessRisk({
      status: 'DONE',
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-10'),
      progress: 50,
      testTypeCount: 3,
    });
    assert.equal(result.riskLevel, 'NONE');
  });

  it('CANCELED 상태는 NONE (M-4)', () => {
    const result = assessRisk({
      status: 'CANCELED',
      startDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-10'),
      progress: 0,
      testTypeCount: 0,
    });
    assert.equal(result.riskLevel, 'NONE');
  });

  it('testTypeCount === 0 이면 progress 강제 0 (C-4)', () => {
    // 이미 절반 이상 지난 태스크에서 testType이 없으면 progress=0으로 강제
    // startDate를 과거로 설정하여 expectedProgress가 충분히 높게 만듦
    const result = assessRisk({
      status: 'IN_PROGRESS',
      startDate: new Date('2026-01-01'),
      dueDate: new Date('2026-06-30'),
      progress: 80, // testTypeCount=0이면 강제 0
      testTypeCount: 0,
    });
    // progress가 0으로 강제되므로 gap이 크고 위험도가 있어야 함
    assert.notEqual(result.riskLevel, 'NONE');
    // gap = expectedProgress - 0 이므로 크다
    assert.ok(result.gap > 0, `Expected positive gap, got ${result.gap}`);
  });

  it('마감 3일 이내 + 진행률 < 70% -> CRITICAL', () => {
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 2); // 2일 후

    const result = assessRisk({
      status: 'IN_PROGRESS',
      startDate: new Date('2026-01-01'),
      dueDate,
      progress: 30,
      testTypeCount: 3,
    });
    assert.equal(result.riskLevel, 'CRITICAL');
  });

  it('gap > 30 -> CRITICAL', () => {
    const result = assessRisk({
      status: 'IN_PROGRESS',
      startDate: new Date('2026-01-01'),
      dueDate: new Date('2026-06-30'),
      progress: 0,  // expected 높은데 progress 0
      testTypeCount: 3,
    });
    // 기대 진행률이 높은 상태에서 0%면 gap > 30
    assert.equal(result.riskLevel, 'CRITICAL');
  });
});
