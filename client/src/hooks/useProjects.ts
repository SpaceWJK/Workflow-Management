import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Project } from '../types';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/api/projects'),
    select: (res) => res.data ?? [],
  });
}

export function useProject(id: number | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
    enabled: !!id,
    select: (res) => res.data,
  });
}
