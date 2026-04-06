import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type {
  AttendanceClockResponse,
  DailyAttendance,
  MonthlyAttendance,
  ApiResponse,
} from '../types';

interface MyTodayStatus {
  date: string;
  hasClockedIn: boolean;
  hasClockedOut: boolean;
  clockIn: string | null;
  clockOut: string | null;
  duration: number | null;
  status: string | null;
}

export function useMyTodayAttendance() {
  return useQuery({
    queryKey: ['attendance', 'me', 'today'],
    queryFn: () => api.get<MyTodayStatus>('/api/attendance/me/today'),
    select: (res) => res.data,
  });
}

export function useAttendanceClock() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (action: 'IN' | 'OUT') =>
      api.post<AttendanceClockResponse>('/api/attendance/clock', { action }),
    onSuccess: (res) => {
      if (res.success && res.data && user) {
        setUser({ ...user, teamStatus: res.data.teamStatus });
        qc.invalidateQueries({ queryKey: ['team'] });
        qc.invalidateQueries({ queryKey: ['attendance'] });
        qc.invalidateQueries({ queryKey: ['attendance', 'me', 'today'] });
      }
    },
  });
}

export function useDailyAttendance(date: string, filters?: { team?: string; projectId?: number }) {
  const params = new URLSearchParams({ date });
  if (filters?.team) params.set('team', filters.team);
  if (filters?.projectId) params.set('projectId', String(filters.projectId));

  return useQuery({
    queryKey: ['attendance', 'daily', date, filters?.team, filters?.projectId],
    queryFn: () => api.get<DailyAttendance>(`/api/attendance/daily?${params}`),
    select: (res) => res.data,
  });
}

export function useMonthlyAttendance(year: number, month: number, filters?: { team?: string; projectId?: number }) {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  if (filters?.team) params.set('team', filters.team);
  if (filters?.projectId) params.set('projectId', String(filters.projectId));

  return useQuery({
    queryKey: ['attendance', 'monthly', year, month, filters?.team, filters?.projectId],
    queryFn: () => api.get<MonthlyAttendance>(`/api/attendance/monthly?${params}`),
    select: (res) => res.data,
  });
}

export function usePersonalAttendance(userId: number | undefined, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['attendance', 'personal', userId, startDate, endDate],
    queryFn: () => api.get<unknown>(`/api/attendance/personal/${userId}?startDate=${startDate}&endDate=${endDate}`),
    select: (res: ApiResponse<unknown>) => res.data as {
      user: { id: number; name: string; team: string | null };
      attendance: Array<{ date: string; clockIn: string | null; clockOut: string | null; duration: number | null; status: string }>;
      taskHours: Array<{
        projectId: number; projectName: string; projectColor: string; totalSeconds: number;
        tasks: Array<{ taskId: number; title: string; totalSeconds: number }>;
      }>;
    },
    enabled: !!userId,
  });
}

export function useProjectHours(startDate: string, endDate: string, projectId?: number) {
  const params = new URLSearchParams({ startDate, endDate });
  if (projectId) params.set('projectId', String(projectId));

  return useQuery({
    queryKey: ['attendance', 'project-hours', startDate, endDate, projectId],
    queryFn: () => api.get<unknown>(`/api/attendance/project-hours?${params}`),
    select: (res: ApiResponse<unknown>) => res.data as {
      period: { startDate: string; endDate: string };
      projects: Array<{
        projectId: number; projectName: string; projectColor: string;
        totalSeconds: number; memberCount: number; avgSecondsPerMember: number;
        members: Array<{ userId: number; name: string; totalSeconds: number }>;
        tasks: Array<{ taskId: number; title: string; totalSeconds: number; assigneeName: string | null }>;
      }>;
    },
    enabled: !!startDate && !!endDate,
  });
}
