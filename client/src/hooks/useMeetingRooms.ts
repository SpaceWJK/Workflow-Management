import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MeetingRoom, ChatMessage, MeetingParticipant, ApiResponse } from '../types';

export function useMeetingRooms() {
  return useQuery({
    queryKey: ['meeting-rooms'],
    queryFn: () => api.get<MeetingRoom[]>('/api/meeting-rooms'),
    select: (res) => res.data ?? [],
    refetchInterval: 10000,
  });
}

export function useMyCurrentMeeting() {
  return useQuery({
    queryKey: ['meeting-rooms', 'me', 'current'],
    queryFn: () => api.get<{
      room: MeetingRoom;
      messages: ChatMessage[];
      participants: MeetingParticipant[];
    } | null>('/api/meeting-rooms/me/current'),
    select: (res) => res.data,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; isPrivate: boolean; password?: string; inviteeIds?: number[] }) =>
      api.post<MeetingRoom>('/api/meeting-rooms', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-rooms'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useJoinMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, password }: { roomId: number; password?: string }) =>
      api.post<{ room: unknown; messages: ChatMessage[]; participants: MeetingParticipant[] }>(
        `/api/meeting-rooms/${roomId}/join`,
        { password }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-rooms'] });
      qc.invalidateQueries({ queryKey: ['meeting-rooms', 'me', 'current'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}

export function useLeaveMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: number) =>
      api.post<{ closed: boolean }>(`/api/meeting-rooms/${roomId}/leave`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-rooms'] });
      qc.invalidateQueries({ queryKey: ['meeting-rooms', 'me', 'current'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });
}
