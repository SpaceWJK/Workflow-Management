// ============================================================
// Attendance 서비스 — 출퇴근 기록 및 근태 관리
// ============================================================

import prisma from '../prisma.js';
import { AppError, NotFoundError } from '../types/index.js';
import { emitMemberStatusChanged, emitDashboardRefresh } from './notification.service.js';

// KST 오프셋 (ms)
const KST_OFFSET = 9 * 3600_000;

/** 현재 시각의 KST 날짜 문자열 (YYYY-MM-DD) */
function toKSTDateStr(d: Date = new Date()): string {
  return new Date(d.getTime() + KST_OFFSET).toISOString().slice(0, 10);
}

/** 날짜 문자열 → Date (UTC 00:00) */
function dateStrToDate(s: string): Date {
  return new Date(s + 'T00:00:00.000Z');
}

// ─────────────────────────────────────────────
// 오늘 출근 상태 확인
// ─────────────────────────────────────────────

export async function getMyTodayStatus(userId: number) {
  const todayStr = toKSTDateStr();
  const todayDate = dateStrToDate(todayStr);

  const log = await prisma.attendanceLog.findUnique({
    where: { userId_date: { userId, date: todayDate } },
  });

  // clockIn 있고 clockOut 없으면 → 출근 상태 (퇴근 버튼 표시)
  // clockIn 있고 clockOut 있으면 → 퇴근 완료 (재출근 버튼 표시)
  // 기록 없으면 → 미출근 (출근 버튼 표시)
  return {
    date: todayStr,
    hasClockedIn: !!log?.clockIn,
    hasClockedOut: !!log?.clockOut,
    clockIn: log?.clockIn?.toISOString() ?? null,
    clockOut: log?.clockOut?.toISOString() ?? null,
    duration: log?.duration ?? null,
    status: log?.status ?? null,
  };
}

// ─────────────────────────────────────────────
// 출퇴근 체크
// ─────────────────────────────────────────────

export async function clockInOut(userId: number, action: 'IN' | 'OUT') {
  if (action === 'IN') return clockIn(userId);
  return clockOut(userId);
}

async function clockIn(userId: number) {
  const now = new Date();
  const todayStr = toKSTDateStr(now);
  const todayDate = dateStrToDate(todayStr);

  // 1. 전일 미퇴근 자동 마감
  const openLog = await prisma.attendanceLog.findFirst({
    where: { userId, clockOut: null, clockIn: { not: null } },
    orderBy: { date: 'desc' },
  });
  if (openLog && openLog.date.toISOString().slice(0, 10) !== todayStr) {
    // 전일 23:59 KST로 자동 마감
    const autoClockOut = new Date(openLog.date.getTime() + 24 * 3600_000 - 60_000); // 23:59 UTC of that date
    const duration = Math.floor((autoClockOut.getTime() - (openLog.clockIn?.getTime() ?? autoClockOut.getTime())) / 1000);
    await prisma.attendanceLog.update({
      where: { id: openLog.id },
      data: { clockOut: autoClockOut, duration: Math.max(duration, 0) },
    });
  }

  // 2. 오늘 레코드 확인
  const existing = await prisma.attendanceLog.findUnique({
    where: { userId_date: { userId, date: todayDate } },
  });

  // 지각 판정 (KST 09:30 = UTC 00:30)
  const kstHour = new Date(now.getTime() + KST_OFFSET).getUTCHours();
  const kstMin = new Date(now.getTime() + KST_OFFSET).getUTCMinutes();
  const isLate = kstHour > 9 || (kstHour === 9 && kstMin >= 30);
  const status = isLate ? 'LATE' : 'PRESENT';

  let attendance;
  if (!existing) {
    // 신규 생성
    attendance = await prisma.attendanceLog.create({
      data: { userId, date: todayDate, clockIn: now, status },
    });
  } else if (existing.clockOut) {
    // 재출근 (퇴근 후 다시 출근)
    attendance = await prisma.attendanceLog.update({
      where: { id: existing.id },
      data: { clockIn: now, clockOut: null, duration: null, status },
    });
  } else if (existing.clockIn) {
    // 이미 출근 상태
    throw new AppError(409, '이미 출근 처리되었습니다.');
  } else {
    // clockIn이 null인 경우 (비정상)
    attendance = await prisma.attendanceLog.update({
      where: { id: existing.id },
      data: { clockIn: now, status },
    });
  }

  // teamStatus 변경
  await prisma.user.update({
    where: { id: userId },
    data: { teamStatus: 'AVAILABLE' },
  });
  emitMemberStatusChanged(userId, 'AVAILABLE');
  emitDashboardRefresh('attendance:clockIn');

  return { attendance, teamStatus: 'AVAILABLE' as const };
}

async function clockOut(userId: number) {
  const now = new Date();

  // clockOut=null인 가장 최근 레코드 (날짜 무관 → 자정 넘긴 근무 지원)
  const openLog = await prisma.attendanceLog.findFirst({
    where: { userId, clockOut: null, clockIn: { not: null } },
    orderBy: { date: 'desc' },
  });

  if (!openLog) {
    throw new AppError(400, '출근 기록이 없습니다. 먼저 출근 체크를 해주세요.');
  }

  const duration = Math.floor((now.getTime() - (openLog.clockIn?.getTime() ?? now.getTime())) / 1000);

  const attendance = await prisma.attendanceLog.update({
    where: { id: openLog.id },
    data: { clockOut: now, duration: Math.max(duration, 0) },
  });

  // teamStatus 변경
  await prisma.user.update({
    where: { id: userId },
    data: { teamStatus: 'OFF_WORK' },
  });
  emitMemberStatusChanged(userId, 'OFF_WORK');
  emitDashboardRefresh('attendance:clockOut');

  return { attendance, teamStatus: 'OFF_WORK' as const };
}

// ─────────────────────────────────────────────
// 일간 출퇴근 현황
// ─────────────────────────────────────────────

export async function getDailyAttendance(date: string, filters?: { team?: string; projectId?: number }) {
  const targetDate = dateStrToDate(date);

  // 활성 사용자 필터
  const userWhere: Record<string, unknown> = { isActive: true };
  if (filters?.team) userWhere.team = filters.team;
  if (filters?.projectId) {
    userWhere.projectMembers = { some: { projectId: filters.projectId } };
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true, team: true, avatarUrl: true },
    orderBy: { name: 'asc' },
  });

  const logs = await prisma.attendanceLog.findMany({
    where: {
      date: targetDate,
      userId: { in: users.map((u) => u.id) },
    },
  });

  const logMap = new Map(logs.map((l) => [l.userId, l]));

  const records = users.map((u) => {
    const log = logMap.get(u.id);
    return {
      userId: u.id,
      name: u.name,
      team: u.team,
      avatarUrl: u.avatarUrl,
      clockIn: log?.clockIn ?? null,
      clockOut: log?.clockOut ?? null,
      duration: log?.duration ?? null,
      status: log?.status ?? 'ABSENT',
    };
  });

  // summary: present = PRESENT+LATE+REMOTE+BUSINESS_TRIP, absent = 기록 없음
  const presentStatuses = ['PRESENT', 'LATE', 'REMOTE', 'BUSINESS_TRIP', 'HALF_DAY'];
  const present = records.filter((r) => presentStatuses.includes(r.status)).length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const remote = records.filter((r) => r.status === 'REMOTE').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;

  return {
    date,
    summary: { total: users.length, present, absent, late, remote },
    records,
  };
}

// ─────────────────────────────────────────────
// 월간 근무시간 요약
// ─────────────────────────────────────────────

export async function getMonthlyAttendance(year: number, month: number, filters?: { team?: string; projectId?: number }) {
  const startDate = dateStrToDate(`${year}-${String(month).padStart(2, '0')}-01`);
  const endDate = new Date(year, month, 0); // 해당 월의 마지막 날
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  // 평일 수 계산 (공휴일 미포함)
  let workingDays = 0;
  const d = new Date(startDate);
  while (d <= dateStrToDate(endDateStr)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) workingDays++;
    d.setDate(d.getDate() + 1);
  }

  // 사용자 필터
  const userWhere: Record<string, unknown> = { isActive: true };
  if (filters?.team) userWhere.team = filters.team;
  if (filters?.projectId) {
    userWhere.projectMembers = { some: { projectId: filters.projectId } };
  }

  const users = await prisma.user.findMany({
    where: userWhere,
    select: { id: true, name: true, team: true, avatarUrl: true },
    orderBy: { name: 'asc' },
  });

  const logs = await prisma.attendanceLog.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      date: { gte: startDate, lte: dateStrToDate(endDateStr) },
    },
  });

  // 사용자별 집계
  const members = users.map((u) => {
    const userLogs = logs.filter((l) => l.userId === u.id);
    const presentDays = userLogs.filter((l) => ['PRESENT', 'LATE', 'REMOTE', 'BUSINESS_TRIP', 'HALF_DAY'].includes(l.status)).length;
    const lateDays = userLogs.filter((l) => l.status === 'LATE').length;
    const totalSeconds = userLogs.reduce((sum, l) => sum + (l.duration ?? 0), 0);
    const avgSecondsPerDay = presentDays > 0 ? Math.round(totalSeconds / presentDays) : 0;

    return {
      userId: u.id,
      name: u.name,
      team: u.team,
      avatarUrl: u.avatarUrl,
      presentDays,
      lateDays,
      absentDays: Math.max(workingDays - presentDays, 0),
      totalSeconds,
      avgSecondsPerDay,
    };
  });

  return { year, month, workingDays, members };
}

// ─────────────────────────────────────────────
// 개인별 근무 상세
// ─────────────────────────────────────────────

export async function getPersonalAttendance(userId: number, startDate: string, endDate: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true },
    select: { id: true, name: true, team: true, avatarUrl: true },
  });
  if (!user) throw new NotFoundError('User');

  const attendance = await prisma.attendanceLog.findMany({
    where: {
      userId,
      date: { gte: dateStrToDate(startDate), lte: dateStrToDate(endDate) },
    },
    orderBy: { date: 'desc' },
  });

  // TaskTimeLog 기반 프로젝트별 소요시간
  const timeLogs = await prisma.taskTimeLog.findMany({
    where: {
      userId,
      startedAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') },
      stoppedAt: { not: null },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
          project: { select: { id: true, name: true, color: true } },
        },
      },
    },
  });

  // 프로젝트별 그루핑
  const projectMap = new Map<number, {
    projectId: number;
    projectName: string;
    projectColor: string;
    totalSeconds: number;
    tasks: Map<number, { taskId: number; title: string; totalSeconds: number }>;
  }>();

  for (const log of timeLogs) {
    const proj = log.task.project;
    if (!proj) continue;
    if (!projectMap.has(proj.id)) {
      projectMap.set(proj.id, {
        projectId: proj.id,
        projectName: proj.name,
        projectColor: proj.color || '#888',
        totalSeconds: 0,
        tasks: new Map(),
      });
    }
    const entry = projectMap.get(proj.id)!;
    entry.totalSeconds += log.duration ?? 0;

    if (!entry.tasks.has(log.task.id)) {
      entry.tasks.set(log.task.id, { taskId: log.task.id, title: log.task.title, totalSeconds: 0 });
    }
    entry.tasks.get(log.task.id)!.totalSeconds += log.duration ?? 0;
  }

  const taskHours = Array.from(projectMap.values()).map((p) => ({
    ...p,
    tasks: Array.from(p.tasks.values()),
  }));

  return { user, attendance, taskHours };
}

// ─────────────────────────────────────────────
// 프로젝트별 소요시간
// ─────────────────────────────────────────────

export async function getProjectHours(startDate: string, endDate: string, projectId?: number) {
  const where: Record<string, unknown> = {
    startedAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') },
    stoppedAt: { not: null },
  };
  if (projectId) {
    where.task = { projectId, isDeleted: false };
  } else {
    where.task = { isDeleted: false };
  }

  const timeLogs = await prisma.taskTimeLog.findMany({
    where,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
          assigneeName: true,
          project: { select: { id: true, name: true, color: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });

  // 프로젝트별 그루핑
  const projectMap = new Map<number, {
    projectId: number;
    projectName: string;
    projectColor: string;
    totalSeconds: number;
    memberSet: Set<number>;
    members: Map<number, { userId: number; name: string; totalSeconds: number }>;
    tasks: Map<number, { taskId: number; title: string; totalSeconds: number; assigneeName: string | null }>;
  }>();

  for (const log of timeLogs) {
    const proj = log.task.project;
    if (!proj) continue;
    if (!projectMap.has(proj.id)) {
      projectMap.set(proj.id, {
        projectId: proj.id,
        projectName: proj.name,
        projectColor: proj.color || '#888',
        totalSeconds: 0,
        memberSet: new Set(),
        members: new Map(),
        tasks: new Map(),
      });
    }
    const entry = projectMap.get(proj.id)!;
    const dur = log.duration ?? 0;
    entry.totalSeconds += dur;
    entry.memberSet.add(log.userId);

    if (!entry.members.has(log.userId)) {
      entry.members.set(log.userId, { userId: log.userId, name: log.user.name, totalSeconds: 0 });
    }
    entry.members.get(log.userId)!.totalSeconds += dur;

    if (!entry.tasks.has(log.task.id)) {
      entry.tasks.set(log.task.id, { taskId: log.task.id, title: log.task.title, totalSeconds: 0, assigneeName: log.task.assigneeName });
    }
    entry.tasks.get(log.task.id)!.totalSeconds += dur;
  }

  const projects = Array.from(projectMap.values()).map((p) => ({
    projectId: p.projectId,
    projectName: p.projectName,
    projectColor: p.projectColor,
    totalSeconds: p.totalSeconds,
    memberCount: p.memberSet.size,
    avgSecondsPerMember: p.memberSet.size > 0 ? Math.round(p.totalSeconds / p.memberSet.size) : 0,
    members: Array.from(p.members.values()),
    tasks: Array.from(p.tasks.values()),
  }));

  return { period: { startDate, endDate }, projects };
}
