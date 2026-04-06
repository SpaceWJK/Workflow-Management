// ===== User =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  teamStatus: TeamStatus;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  team?: string;
}

export type TeamStatus = 'AVAILABLE' | 'IN_MEETING' | 'AWAY' | 'ON_LEAVE' | 'HALF_DAY' | 'REMOTE' | 'BUSINESS_TRIP' | 'FIELD_WORK' | 'OFF_WORK';

export const TEAM_STATUS_MAP: Record<TeamStatus, { label: string; color: string }> = {
  AVAILABLE: { label: '근무중', color: 'var(--color-success)' },
  IN_MEETING: { label: '회의중', color: 'var(--color-warning)' },
  AWAY: { label: '자리비움', color: 'var(--color-text-secondary)' },
  ON_LEAVE: { label: '휴가', color: 'var(--color-info)' },
  HALF_DAY: { label: '반차', color: '#60a5fa' },
  REMOTE: { label: '재택', color: 'var(--color-primary)' },
  BUSINESS_TRIP: { label: '출장', color: '#a855f7' },
  FIELD_WORK: { label: '외근', color: '#f97316' },
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
  assigneeName?: string;
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
  buildLinks?: Array<{ buildId?: number; build?: { id: number; updateTarget?: string } }>;
}

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export const PRIORITY_MAP: Record<Priority, { label: string; color: string; order: number }> = {
  URGENT: { label: '긴급', color: 'var(--color-danger)', order: 0 },
  HIGH: { label: '높음', color: '#f97316', order: 1 },
  NORMAL: { label: '보통', color: 'var(--color-warning)', order: 2 },
  LOW: { label: '낮음', color: 'var(--color-text-secondary)', order: 3 },
};

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | 'CANCELED';

export const TASK_STATUS_MAP: Record<TaskStatus, { label: string; color: string }> = {
  PENDING: { label: '대기', color: 'var(--color-text-secondary)' },
  IN_PROGRESS: { label: '진행', color: 'var(--color-primary)' },
  ON_HOLD: { label: '보류', color: 'var(--color-warning)' },
  DONE: { label: '완료', color: 'var(--color-success)' },
  CANCELED: { label: '중단', color: 'var(--color-danger)' },
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

// ===== Build =====
export interface Build {
  id: number;
  projectId: number;
  buildOrder: number;
  receivedDate: string;
  updateTarget: string;
  status: BuildStatus;
  memo?: string;
  version: number;
  rejectionReason?: string;
  rejectionHistory?: Array<{ reason: string; rejectedBy: string; rejectedAt: string }>;
  project?: Pick<Project, 'id' | 'name' | 'color'>;
  buildVersions?: BuildVersion[];
  taskLinks?: TaskBuildLink[];
  _count?: { buildVersions: number; taskLinks: number };
}

export interface BuildVersion {
  id: number;
  buildId: number;
  buildType: 'APP' | 'CDN' | 'SERVER';
  platform?: 'iOS' | 'AOS' | 'PC';
  cdnType?: string;
  version: string;
  note?: string;
}

export interface TaskBuildLink {
  id: number;
  taskId: number;
  buildId: number;
  task?: Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'assigneeName'>;
}

export type BuildStatus = 'RECEIVED' | 'TESTING' | 'TEST_DONE' | 'APPROVED' | 'REJECTED' | 'RELEASED';

export const BUILD_STATUS_MAP: Record<BuildStatus, { label: string; color: string }> = {
  RECEIVED: { label: '수급', color: 'var(--color-info)' },
  TESTING: { label: '테스트 중', color: 'var(--color-primary)' },
  TEST_DONE: { label: '테스트 완료', color: 'var(--color-warning)' },
  APPROVED: { label: '승인', color: 'var(--color-success)' },
  REJECTED: { label: '반려', color: 'var(--color-danger)' },
  RELEASED: { label: '배포 완료', color: '#10b981' },
};

// ===== Timer =====
export interface TaskTimeLog {
  id: number;
  taskId: number;
  userId: number;
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
}

export interface TimerStatus {
  isRunning: boolean;
  currentLog?: TaskTimeLog & { elapsed: number };
  totalSeconds: number;
  logs: TaskTimeLog[];
}

// ===== Calendar Event =====
export type CalendarEventType = 'VACATION' | 'BUSINESS_TRIP' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'REMOTE' | 'MEETING' | 'OTHER';

export interface CalendarEvent {
  id: number;
  userId: number;
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  memo?: string;
  user?: Pick<User, 'id' | 'name'>;
}

export const CALENDAR_EVENT_TYPE_MAP: Record<CalendarEventType, { label: string; color: string }> = {
  VACATION: { label: '휴가', color: 'var(--color-danger)' },
  BUSINESS_TRIP: { label: '출장', color: '#f97316' },
  HALF_DAY_AM: { label: '오전반차', color: 'var(--color-warning)' },
  HALF_DAY_PM: { label: '오후반차', color: '#eab308' },
  REMOTE: { label: '재택', color: 'var(--color-success)' },
  MEETING: { label: '회의', color: 'var(--color-info)' },
  OTHER: { label: '기타', color: 'var(--color-text-secondary)' },
};

// ===== Attendance =====
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' | 'HALF_DAY' | 'REMOTE' | 'BUSINESS_TRIP';

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatus, { label: string; color: string }> = {
  PRESENT: { label: '정상', color: 'var(--color-success)' },
  LATE: { label: '지각', color: 'var(--color-warning)' },
  EARLY_LEAVE: { label: '조퇴', color: '#f97316' },
  ABSENT: { label: '결근', color: 'var(--color-danger)' },
  HALF_DAY: { label: '반차', color: '#60a5fa' },
  REMOTE: { label: '재택', color: 'var(--color-primary)' },
  BUSINESS_TRIP: { label: '출장', color: '#a855f7' },
};

export interface AttendanceRecord {
  userId: number;
  name: string;
  team: string | null;
  avatarUrl: string | null;
  clockIn: string | null;
  clockOut: string | null;
  duration: number | null;
  status: AttendanceStatus | 'ABSENT';
}

export interface DailyAttendance {
  date: string;
  summary: { total: number; present: number; absent: number; late: number; remote: number };
  records: AttendanceRecord[];
}

export interface MonthlyMember {
  userId: number;
  name: string;
  team: string | null;
  avatarUrl: string | null;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalSeconds: number;
  avgSecondsPerDay: number;
}

export interface MonthlyAttendance {
  year: number;
  month: number;
  workingDays: number;
  members: MonthlyMember[];
}

// ===== Meeting Room =====
export interface MeetingRoom {
  id: number;
  title: string;
  isPrivate: boolean;
  createdBy: number;
  creatorName: string;
  participantCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  userId: number;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

export interface MeetingParticipant {
  id: number;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export interface AttendanceClockResponse {
  attendance: {
    id: number;
    userId: number;
    date: string;
    clockIn: string | null;
    clockOut: string | null;
    duration: number | null;
    status: string;
  };
  teamStatus: TeamStatus;
}
