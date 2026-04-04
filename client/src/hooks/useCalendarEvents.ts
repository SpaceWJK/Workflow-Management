import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CalendarEvent, ApiResponse } from '../types';

export function useCalendarEvents(
  startDate: string,
  endDate: string,
  userId?: number
) {
  const params = new URLSearchParams({ startDate, endDate });
  if (userId) params.set('userId', String(userId));
  const qs = params.toString();

  return useQuery({
    queryKey: ['calendarEvents', startDate, endDate, userId],
    queryFn: () => api.get<CalendarEvent[]>(`/api/calendar/events?${qs}`),
    select: (res) => res.data ?? [],
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CalendarEvent, 'id' | 'userId' | 'user'>) =>
      api.post<CalendarEvent>('/api/calendar/events', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Omit<CalendarEvent, 'userId' | 'user'>> & { id: number }) =>
      api.put<CalendarEvent>(`/api/calendar/events/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api.delete<ApiResponse<null>>(`/api/calendar/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendarEvents'] }),
  });
}
