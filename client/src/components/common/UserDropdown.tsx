import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, LogOut, Clock, ListTodo, Activity } from 'lucide-react';
import type { User } from '../../types';
import { TEAM_STATUS_MAP } from '../../types';
import { getInitials } from '../../lib/utils';

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { path: '/profile', label: '프로필 설정', icon: UserIcon },
  { path: '/profile/status', label: '상태 업데이트', icon: Activity },
  { path: '/profile/clock', label: '출/퇴근 체크', icon: Clock },
  { path: '/profile/today', label: '오늘 할 일', icon: ListTodo },
  { path: '/profile/password', label: '비밀번호 변경', icon: Lock },
];

export default function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleNavigate = (path: string) => { setOpen(false); navigate(path); };

  const statusMeta = TEAM_STATUS_MAP[user.teamStatus];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="사용자 메뉴 열기"
        aria-expanded={open}
        aria-haspopup="true"
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-opacity hover:opacity-80 cursor-pointer"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
      >
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
          : getInitials(user.name)
        }
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-56 rounded-xl shadow-lg py-1 z-50"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</div>
            {statusMeta && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusMeta.color }} />
                <span className="text-xs" style={{ color: statusMeta.color }}>{statusMeta.label}</span>
              </div>
            )}
          </div>

          {/* 메뉴 항목 */}
          {MENU_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              role="menuitem"
              onClick={() => handleNavigate(path)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
            >
              <Icon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              {label}
            </button>
          ))}

          <div className="border-t my-1" style={{ borderColor: 'var(--color-border)' }} />

          <button
            role="menuitem"
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
            style={{ color: 'var(--color-danger)' }}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
