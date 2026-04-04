import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Build, ApiResponse } from '../types';

export interface BuildFilter {
  projectId?: number;
  status?: string;
  updateTarget?: string;
}

export function useBuilds(filter?: BuildFilter) {
  const params = new URLSearchParams();
  if (filter?.projectId) params.set('projectId', String(filter.projectId));
  if (filter?.status) params.set('status', filter.status);
  if (filter?.updateTarget) params.set('updateTarget', filter.updateTarget);
  const qs = params.toString();

  return useQuery({
    queryKey: ['builds', filter],
    queryFn: () => api.get<Build[]>(`/api/builds${qs ? `?${qs}` : ''}`),
    select: (res) => res.data ?? [],
  });
}

export function useBuild(id: number | undefined) {
  return useQuery({
    queryKey: ['builds', id],
    queryFn: () => api.get<Build>(`/api/builds/${id}`),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post<Build>('/api/builds', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builds'] }),
  });
}

export function useUpdateBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: number }) =>
      api.put<Build>(`/api/builds/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builds'] }),
  });
}

export function useDeleteBuild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<ApiResponse<null>>(`/api/builds/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builds'] }),
  });
}

export function useUpdateBuildStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) =>
      api.patch<Build>(`/api/builds/${id}/status`, { status, ...(rejectionReason ? { rejectionReason } : {}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builds'] }),
  });
}

export function useUpdateTargets(projectId: number | undefined) {
  return useQuery({
    queryKey: ['builds', 'targets', projectId],
    queryFn: () => api.get<string[]>(`/api/builds/targets?projectId=${projectId}`),
    enabled: !!projectId,
    select: (res) => (res.data ?? []).map((d: string) => d.includes('T') ? d.split('T')[0] : d),
  });
}

export function useBuildsByTarget(projectId: number | undefined, target: string | undefined) {
  return useQuery({
    queryKey: ['builds', 'byTarget', projectId, target],
    queryFn: () =>
      api.get<Build[]>(`/api/builds?projectId=${projectId}&updateTarget=${target}`),
    enabled: !!projectId && !!target,
    select: (res) => res.data ?? [],
  });
}

export function useCdnTypes(projectId: number | undefined) {
  return useQuery({
    queryKey: ['builds', 'cdnTypes', projectId],
    queryFn: () => api.get<string[]>(`/api/builds/cdn-types?projectId=${projectId}`),
    enabled: !!projectId,
    select: (res) => res.data ?? [],
  });
}

export function useLinkTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ buildId, taskIds }: { buildId: number; taskIds: number[] }) =>
      api.post<ApiResponse<null>>(`/api/builds/${buildId}/tasks`, { taskIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['builds'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUnlinkTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ buildId, taskId }: { buildId: number; taskId: number }) =>
      api.delete<ApiResponse<null>>(`/api/builds/${buildId}/tasks/${taskId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['builds'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
