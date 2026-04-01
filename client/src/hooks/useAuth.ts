import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { disconnectSocket } from '../lib/socket';
import type { User } from '../types';

export function useAuth() {
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(async (name: string, password: string) => {
    const res = await api.post<{ user: User; token: string; refreshToken: string }>(
      '/api/auth/login',
      { name, password }
    );
    if (res.success) {
      storeLogin(res.data.user, res.data.token, res.data.refreshToken);
      navigate('/');
      return { success: true };
    }
    return { success: false, message: res.message || '로그인에 실패했습니다.' };
  }, [storeLogin, navigate]);

  const logout = useCallback(() => {
    disconnectSocket();
    storeLogout();
    navigate('/login');
  }, [storeLogout, navigate]);

  return { user, isAuthenticated, login, logout };
}
