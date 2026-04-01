import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { User } from '../types';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<User[]>('/api/team'),
    select: (res) => res.data ?? [],
  });
}

export function useTeamMember(id: number | undefined) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => api.get<User>(`/api/team/${id}`),
    enabled: !!id,
    select: (res) => res.data,
  });
}
