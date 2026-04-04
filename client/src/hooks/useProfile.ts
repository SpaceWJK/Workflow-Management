import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { User, TeamStatus, Task, ApiResponse } from '../types';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: { phone?: string | null; bio?: string | null }) =>
      api.put<User>('/api/auth/profile', data),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setUser(res.data);
      }
    },
  });
}

export function useUploadAvatar() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      return res.json() as Promise<ApiResponse<{ id: number; avatarUrl: string }>>;
    },
    onSuccess: async (res) => {
      if (res.success && res.data) {
        // /me를 다시 호출해서 전체 user 데이터 갱신
        const meRes = await api.get<User>('/api/auth/me');
        if (meRes.success && meRes.data) {
          setUser(meRes.data);
        } else if (user) {
          setUser({ ...user, avatarUrl: res.data.avatarUrl });
        }
      }
    },
  });
}

export function useUpdateMyStatus() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (status: TeamStatus) =>
      api.patch<{ id: number; name: string; teamStatus: TeamStatus }>('/api/team/me/status', { status }),
    onSuccess: (res) => {
      if (res.success && res.data && user) {
        setUser({ ...user, teamStatus: res.data.teamStatus });
        qc.invalidateQueries({ queryKey: ['team'] });
      }
    },
  });
}

export function useClockInOut() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (action: 'IN' | 'OUT') =>
      api.post<{ id: number; name: string; teamStatus: TeamStatus; clockedAt: string }>('/api/team/me/clock', { action }),
    onSuccess: (res) => {
      if (res.success && res.data && user) {
        setUser({ ...user, teamStatus: res.data.teamStatus });
        qc.invalidateQueries({ queryKey: ['team'] });
      }
    },
  });
}

export function useMyTodayTasks() {
  const user = useAuthStore((s) => s.user);
  const today = new Date().toISOString().slice(0, 10);

  return useQuery({
    queryKey: ['myTodayTasks', user?.id, today],
    queryFn: () => api.get<Task[]>(`/api/tasks?assigneeId=${user?.id}&startDate=${today}&endDate=${today}`),
    select: (res) => res.data ?? [],
    enabled: !!user?.id,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put<{ message: string }>('/api/auth/password', data),
  });
}
