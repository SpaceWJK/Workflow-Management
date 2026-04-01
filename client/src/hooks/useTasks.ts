import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Task, TaskFilter, PaginatedResponse, ApiResponse } from '../types';

export function useTasks(filter?: TaskFilter) {
  const params = new URLSearchParams();
  if (filter?.projectId) params.set('projectId', String(filter.projectId));
  if (filter?.assigneeId) params.set('assigneeId', String(filter.assigneeId));
  if (filter?.status) params.set('status', filter.status);
  if (filter?.priority) params.set('priority', filter.priority);
  if (filter?.riskLevel) params.set('riskLevel', filter.riskLevel);
  if (filter?.search) params.set('search', filter.search);
  const qs = params.toString();

  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => api.get<PaginatedResponse<Task>['data']>(`/api/tasks${qs ? `?${qs}` : ''}`),
    select: (res) => res.data ?? [],
  });
}

export function useTask(id: number | undefined) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => api.get<Task>(`/api/tasks/${id}`),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Task>('/api/tasks', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: number }) =>
      api.put<Task>(`/api/tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<ApiResponse<null>>(`/api/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
