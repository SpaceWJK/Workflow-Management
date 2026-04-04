import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Lock, LogOut } from 'lucide-react';
import type { User } from '../../types';
import { getInitials } from '../../lib/utils';

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
}

export default function UserDropdown({ user, onLogout }: UserDropdownProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // ESC 키 닫기
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleNavigate = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="사용자 메뉴 열기"
        aria-expanded={open}
        aria-haspopup="true"
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
      >
        {getInitials(user.name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-10 w-52 rounded-xl shadow-lg py-1 z-50"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-sm font-semibold truncate">{user.name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {user.email}
            </div>
          </div>

          {/* 프로필 메뉴 */}
          <button
            role="menuitem"
            onClick={() => handleNavigate('/profile')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <UserIcon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            프로필 설정
          </button>

          <button
            role="menuitem"
            onClick={() => handleNavigate('/profile?tab=password')}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <Lock className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            비밀번호 변경
          </button>

          <div className="border-t my-1" style={{ borderColor: 'var(--color-border)' }} />

          {/* 로그아웃 */}
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onLogout(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-hover)]"
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
