// ============================================================
// 공통 타입 정의
// ============================================================

import type { Request } from 'express';

// --- API 응답 ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]> | string[];
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

// --- JWT ---

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// --- Enums (Prisma 스키마와 동기화) ---

export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'DONE'
  | 'CANCELED';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export type TestType =
  | 'BVT'
  | 'BAT'
  | 'FUNCTIONALITY'
  | 'PERFORMANCE'
  | 'COMPATIBILITY'
  | 'LOCALIZATION'
  | 'BALANCE';

export type LeaveType = 'ANNUAL' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'SICK' | 'REMOTE' | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';

// --- 상태 전이 매트릭스 ---

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  PENDING: ['IN_PROGRESS', 'ON_HOLD', 'CANCELED'],
  IN_PROGRESS: ['ON_HOLD', 'DONE', 'CANCELED'],
  ON_HOLD: ['PENDING', 'IN_PROGRESS', 'CANCELED'],
  DONE: ['IN_PROGRESS'],
  CANCELED: ['PENDING'],
};

// --- 필터/쿼리 ---

export interface TaskFilterParams {
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  testType?: TestType;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// --- Socket 이벤트 ---

export interface ServerToClientEvents {
  'task:created': (data: { task: unknown }) => void;
  'task:updated': (data: { task: unknown }) => void;
  'task:deleted': (data: { taskId: string }) => void;
  'task:progress': (data: { taskId: string; progress: number; testType: string }) => void;
  'task:statusChanged': (data: { taskId: string; from: TaskStatus; to: TaskStatus }) => void;
  'team:statusChanged': (data: { userId: string; status: string }) => void;
  'project:updated': (data: { project: unknown }) => void;
  'dashboard:refresh': (data: { reason: string }) => void;
}

export interface ClientToServerEvents {
  'join:project': (projectId: string) => void;
  'leave:project': (projectId: string) => void;
}

// --- Error ---

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]> | string[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource has been modified by another user') {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}
