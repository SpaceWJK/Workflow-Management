// ===== User =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  teamStatus: TeamStatus;
  avatarUrl?: string;
}

export type TeamStatus = 'AVAILABLE' | 'IN_MEETING' | 'AWAY' | 'ON_LEAVE' | 'HALF_DAY' | 'REMOTE' | 'BUSINESS_TRIP' | 'OFF_WORK';

export const TEAM_STATUS_MAP: Record<TeamStatus, { label: string; color: string }> = {
  AVAILABLE: { label: '근무중', color: 'var(--color-success)' },
  IN_MEETING: { label: '회의중', color: 'var(--color-warning)' },
  AWAY: { label: '자리비움', color: 'var(--color-text-secondary)' },
  ON_LEAVE: { label: '휴가', color: 'var(--color-info)' },
  HALF_DAY: { label: '반차', color: '#60a5fa' },
  REMOTE: { label: '재택', color: 'var(--color-primary)' },
  BUSINESS_TRIP: { label: '출장', color: '#a855f7' },
  OFF_WORK: { label: '퇴근', color: 'var(--color-text-secondary)' },
};

// ===== Project =====
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: ProjectStatus;
  color?: string;
  startDate?: string;
  endDate?: string;
  taskCount?: number;
  completedCount?: number;
  delayedCount?: number;
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'planning';

export const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  active: { label: '진행중', color: 'var(--color-primary)' },
  completed: { label: '완료', color: 'var(--color-success)' },
  on_hold: { label: '보류', color: 'var(--color-warning)' },
  planning: { label: '기획중', color: 'var(--color-info)' },
};

// ===== Task =====
export interface Task {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  assigneeId?: number;
  priority: Priority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  progressTotal: number;
  expectedProgress: number;
  riskLevel: RiskLevel;
  memo?: string;
  version: number;
  project?: Project;
  assignee?: User;
  testTypes?: TaskTestType[];
}

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const PRIORITY_MAP: Record<Priority, { label: string; color: string; order: number }> = {
  URGENT: { label: '긴급', color: 'var(--color-danger)', order: 0 },
  HIGH: { label: '높음', color: '#f97316', order: 1 },
  NORMAL: { label: '보통', color: 'var(--color-warning)', order: 2 },
  LOW: { label: '낮음', color: 'var(--color-text-secondary)', order: 3 },
};

export type TaskStatus = 'BACKLOG' | 'PENDING' | 'READY' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'ON_HOLD' | 'DONE' | 'DELAYED' | 'CANCELED';

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  BACKLOG: { label: '백로그', color: 'var(--color-text-secondary)' },
  PENDING: { label: '대기', color: 'var(--color-text-secondary)' },
  READY: { label: '진행예정', color: 'var(--color-info)' },
  IN_PROGRESS: { label: '진행중', color: 'var(--color-primary)' },
  REVIEW: { label: '리뷰', color: '#a855f7' },
  BLOCKED: { label: '차단', color: 'var(--color-danger)' },
  ON_HOLD: { label: '보류', color: 'var(--color-warning)' },
  DONE: { label: '완료', color: 'var(--color-success)' },
  DELAYED: { label: '지연', color: 'var(--color-danger)' },
  CANCELED: { label: '취소', color: 'var(--color-text-secondary)' },
};

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const RISK_LEVEL_MAP: Record<RiskLevel, { label: string; color: string }> = {
  LOW: { label: '낮음', color: 'var(--color-success)' },
  MEDIUM: { label: '보통', color: 'var(--color-warning)' },
  HIGH: { label: '높음', color: '#f97316' },
  CRITICAL: { label: '위험', color: 'var(--color-danger)' },
};

// ===== TaskTestType =====
export interface TaskTestType {
  id: number;
  taskId: number;
  testTypeCode: string;
  progress: number;
  note?: string;
}

export interface TestTypeCode {
  id: number;
  code: string;
  name: string;
}

// ===== API Response =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ===== Filter =====
export interface TaskFilter {
  projectId?: number;
  assigneeId?: number;
  status?: TaskStatus;
  priority?: Priority;
  riskLevel?: RiskLevel;
  search?: string;
}

// ===== Dashboard =====
export interface DashboardKPI {
  totalProjects: number;
  totalTasks: number;
  inProgressTasks: number;
  delayedTasks: number;
  dueTodayTasks: number;
  absentMembers: number;
}

// ===== Schedule =====
export interface ScheduleEvent {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  type: 'task' | 'milestone' | 'meeting';
  projectId?: number;
  color?: string;
}
