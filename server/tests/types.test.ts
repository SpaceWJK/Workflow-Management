// ============================================================
// types/index 테스트 (상태 전이 매트릭스 + 에러 클래스)
// ============================================================

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VALID_TRANSITIONS,
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '../src/types/index.js';
import type { TaskStatus } from '../src/types/index.js';

describe('VALID_TRANSITIONS', () => {
  it('BACKLOG에서 PENDING, READY, CANCELED으로 전이 가능', () => {
    assert.deepEqual(VALID_TRANSITIONS.BACKLOG, ['PENDING', 'READY', 'CANCELED']);
  });

  it('CANCELED에서 어디로도 전이 불가', () => {
    assert.deepEqual(VALID_TRANSITIONS.CANCELED, []);
  });

  it('DONE에서 IN_PROGRESS만 가능 (재오픈)', () => {
    assert.deepEqual(VALID_TRANSITIONS.DONE, ['IN_PROGRESS']);
  });

  it('IN_PROGRESS에서 5개 상태로 전이 가능', () => {
    const transitions = VALID_TRANSITIONS.IN_PROGRESS;
    assert.equal(transitions.length, 5);
    assert.ok(transitions.includes('REVIEW'));
    assert.ok(transitions.includes('BLOCKED'));
    assert.ok(transitions.includes('ON_HOLD'));
    assert.ok(transitions.includes('DELAYED'));
    assert.ok(transitions.includes('CANCELED'));
  });

  it('모든 TaskStatus 키가 존재', () => {
    const allStatuses: TaskStatus[] = [
      'BACKLOG', 'PENDING', 'READY', 'IN_PROGRESS', 'REVIEW',
      'BLOCKED', 'ON_HOLD', 'DONE', 'DELAYED', 'CANCELED',
    ];
    for (const status of allStatuses) {
      assert.ok(status in VALID_TRANSITIONS, `Missing key: ${status}`);
    }
  });
});

describe('AppError', () => {
  it('statusCode와 message 설정', () => {
    const err = new AppError(400, 'Bad request');
    assert.equal(err.statusCode, 400);
    assert.equal(err.message, 'Bad request');
    assert.equal(err.name, 'AppError');
  });

  it('errors 필드 옵션', () => {
    const err = new AppError(400, 'Validation', { field: ['required'] });
    assert.deepEqual(err.errors, { field: ['required'] });
  });
});

describe('ConflictError', () => {
  it('409 상태 코드', () => {
    const err = new ConflictError();
    assert.equal(err.statusCode, 409);
    assert.equal(err.name, 'ConflictError');
  });
});

describe('NotFoundError', () => {
  it('404 + 리소스명 포함', () => {
    const err = new NotFoundError('Task');
    assert.equal(err.statusCode, 404);
    assert.equal(err.message, 'Task not found');
  });
});

describe('UnauthorizedError', () => {
  it('401 상태 코드', () => {
    const err = new UnauthorizedError();
    assert.equal(err.statusCode, 401);
  });
});

describe('ForbiddenError', () => {
  it('403 상태 코드', () => {
    const err = new ForbiddenError();
    assert.equal(err.statusCode, 403);
  });
});
