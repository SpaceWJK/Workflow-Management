import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Loader2, Camera } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateProfile, useUploadAvatar } from '../../hooks/useProfile';
import { getInitials } from '../../lib/utils';
import { api } from '../../lib/api';
import type { User } from '../../types';
import AvatarCropModal from './AvatarCropModal';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

  // 페이지 진입 시 최신 user 데이터 fetch
  useEffect(() => {
    api.get<User>('/api/auth/me').then((res) => {
      if (res.success && res.data) setUser(res.data);
    });
  }, [setUser]);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  useEffect(() => {
    if (user) { setPhone(user.phone ?? ''); setBio(user.bio ?? ''); }
  }, [user]);

  // 전화번호 자동 하이픈 포맷 (01012345678 → 010-1234-5678)
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await updateProfile.mutateAsync({ phone: phone.trim() || null, bio: bio.trim() || null });
    setMsg(res.success
      ? { type: 'success', text: '프로필이 저장되었습니다.' }
      : { type: 'error', text: res.message || '저장에 실패했습니다.' }
    );
  };

  const handleAvatarSave = async (file: File) => {
    const res = await uploadAvatar.mutateAsync(file);
    if (!res.success) setMsg({ type: 'error', text: res.message || '업로드에 실패했습니다.' });
  };

  const inputStyle = {
    backgroundColor: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-bold">프로필 설정</h1>

      <section
        className="rounded-xl p-6 flex flex-col gap-5"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <UserIcon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold">기본 정보</h2>
        </div>

        {/* 아바타 */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>
                {getInitials(user?.name ?? '')}
              </div>
            )}
            <button
              type="button"
              onClick={() => setAvatarModalOpen(true)}
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadAvatar.isPending ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </button>
          </div>
          <div>
            <div className="text-base font-medium">{user?.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{user?.role}</div>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>이름</label>
            <input type="text" value={user?.name ?? ''} readOnly className="px-3 py-2 rounded-lg text-sm outline-none" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>이메일</label>
            <input type="email" value={user?.email ?? ''} readOnly className="px-3 py-2 rounded-lg text-sm outline-none" style={{ ...inputStyle, opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-phone" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>연락처</label>
            <input id="profile-phone" type="tel" value={phone} onChange={handlePhoneChange} className="px-3 py-2 rounded-lg text-sm outline-none transition-colors" style={inputStyle} placeholder="010-0000-0000" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-bio" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>소개</label>
            <textarea id="profile-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors" style={inputStyle} placeholder="간단한 소개를 입력해 주세요" maxLength={500} />
          </div>

          {msg && (
            <p className="text-xs" style={{ color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} role="alert">{msg.text}</p>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={updateProfile.isPending} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer" style={{ backgroundColor: 'var(--color-primary)' }}>
              {updateProfile.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              저장
            </button>
          </div>
        </form>
      </section>

      <AvatarCropModal isOpen={avatarModalOpen} onClose={() => setAvatarModalOpen(false)} onSave={handleAvatarSave} userName={user?.name ?? ''} isPending={uploadAvatar.isPending} />
    </motion.div>
  );
}
