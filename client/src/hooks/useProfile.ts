import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.put<User>('/api/auth/profile', data),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setUser(res.data);
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.put<{ message: string }>('/api/auth/password', data),
  });
}
