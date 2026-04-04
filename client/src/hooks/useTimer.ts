import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TimerStatus } from '../types';

export function useTimerStatus(taskId: number | undefined) {
  return useQuery({
    queryKey: ['timer', taskId],
    queryFn: () => api.get<TimerStatus>(`/api/tasks/${taskId}/timer`),
    enabled: !!taskId,
    select: (res) => res.data,
    refetchInterval: (query) => {
      // 타이머가 실행 중이면 10초마다 서버 동기화
      const timerData = query.state.data?.data;
      return timerData?.isRunning ? 10_000 : false;
    },
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) =>
      api.post<TimerStatus>(`/api/tasks/${taskId}/timer/start`, {}),
    onSuccess: (_data, taskId) => {
      qc.invalidateQueries({ queryKey: ['timer', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) =>
      api.post<TimerStatus>(`/api/tasks/${taskId}/timer/stop`, {}),
    onSuccess: (_data, taskId) => {
      qc.invalidateQueries({ queryKey: ['timer', taskId] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
