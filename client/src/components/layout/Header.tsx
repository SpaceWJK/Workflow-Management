import { Search, Bell, Wifi, WifiOff } from 'lucide-react';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../lib/utils';

interface HeaderProps {
  connected: boolean;
}

export default function Header({ connected }: HeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  return (
    <header
      className="flex items-center justify-between h-14 px-6 border-b shrink-0"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Left: Search */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-72"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Search className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          placeholder="검색..."
          className="bg-transparent border-none outline-none text-sm w-full"
          style={{ color: 'var(--color-text)' }}
        />
      </div>

      {/* Right: Date + Connection + Notifications + Profile */}
      <div className="flex items-center gap-4">
        {/* Date */}
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {dayjs().format('YYYY년 MM월 DD일 (ddd)')}
        </span>

        {/* Connection indicator */}
        <div className="flex items-center gap-1">
          {connected ? (
            <Wifi className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
          ) : (
            <WifiOff className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
          )}
        </div>

        {/* Notification bell */}
        <button className="relative p-1.5 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors">
          <Bell className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          <span
            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--color-danger)' }}
          />
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            {user ? getInitials(user.name) : '?'}
          </div>
          {user && (
            <button
              onClick={logout}
              className="text-xs hover:underline"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
