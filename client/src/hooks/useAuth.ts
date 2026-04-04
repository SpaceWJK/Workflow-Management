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
    try {
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
    } catch {
      return { success: false, message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' };
    }
  }, [storeLogin, navigate]);

  const logout = useCallback(() => {
    disconnectSocket();
    storeLogout();
    navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  return { user, isAuthenticated, login, logout };
}
