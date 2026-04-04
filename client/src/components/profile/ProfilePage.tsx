import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateProfile, useChangePassword } from '../../hooks/useProfile';
import { getInitials } from '../../lib/utils';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const passwordSectionRef = useRef<HTMLDivElement>(null);

  // 프로필 수정 폼 상태
  const [name, setName] = useState(user?.name ?? '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 비밀번호 변경 폼 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // tab=password 파라미터로 접근 시 비밀번호 섹션으로 자동 스크롤
  useEffect(() => {
    if (searchParams.get('tab') === 'password' && passwordSectionRef.current) {
      setTimeout(() => {
        passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [searchParams]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: '이름을 입력해 주세요.' });
      return;
    }
    const res = await updateProfile.mutateAsync({ name: name.trim() });
    if (res.success) {
      setProfileMsg({ type: 'success', text: '프로필이 저장되었습니다.' });
    } else {
      setProfileMsg({ type: 'error', text: res.message || '저장에 실패했습니다.' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: '모든 항목을 입력해 주세요.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }
    const res = await changePassword.mutateAsync({ currentPassword, newPassword });
    if (res.success) {
      setPasswordMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ type: 'error', text: res.message || '비밀번호 변경에 실패했습니다.' });
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-bold">프로필 설정</h1>

      {/* 프로필 정보 섹션 */}
      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold">기본 정보</h2>
        </div>

        {/* 아바타 */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
            aria-label={`${user?.name ?? ''} 아바타`}
          >
            {getInitials(user?.name ?? '')}
          </div>
          <div>
            <div className="text-sm font-medium">{user?.name}</div>
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {user?.email}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* 이름 수정 폼 */}
        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-name" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              이름
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
              }}
              placeholder="이름 입력"
            />
          </div>

          {profileMsg && (
            <p
              className="text-xs"
              style={{ color: profileMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}
              role="alert"
            >
              {profileMsg.text}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {updateProfile.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              저장
            </button>
          </div>
        </form>
      </section>

      {/* 비밀번호 변경 섹션 */}
      <section
        ref={passwordSectionRef}
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold">비밀번호 변경</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
          {[
            { id: 'current-password', label: '현재 비밀번호', value: currentPassword, setter: setCurrentPassword },
            { id: 'new-password', label: '새 비밀번호', value: newPassword, setter: setNewPassword },
            { id: 'confirm-password', label: '새 비밀번호 확인', value: confirmPassword, setter: setConfirmPassword },
          ].map(({ id, label, value, setter }) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                {label}
              </label>
              <input
                id={id}
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
                placeholder={label}
              />
            </div>
          ))}

          {passwordMsg && (
            <p
              className="text-xs"
              style={{ color: passwordMsg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}
              role="alert"
            >
              {passwordMsg.text}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {changePassword.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              비밀번호 변경
            </button>
          </div>
        </form>
      </section>
    </motion.div>
  );
}
