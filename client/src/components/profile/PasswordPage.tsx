import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { useChangePassword } from '../../hooks/useProfile';

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const changePassword = useChangePassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMsg({ type: 'error', text: '모든 항목을 입력해 주세요.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }
    const res = await changePassword.mutateAsync({ currentPassword, newPassword });
    if (res.success) {
      setMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } else {
      setMsg({ type: 'error', text: res.message || '비밀번호 변경에 실패했습니다.' });
    }
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
      <h1 className="text-xl font-bold">비밀번호 변경</h1>

      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold">비밀번호 변경</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { id: 'current-password', label: '현재 비밀번호', value: currentPassword, setter: setCurrentPassword },
            { id: 'new-password', label: '새 비밀번호', value: newPassword, setter: setNewPassword },
            { id: 'confirm-password', label: '새 비밀번호 확인', value: confirmPassword, setter: setConfirmPassword },
          ].map(({ id, label, value, setter }) => (
            <div key={id} className="flex flex-col gap-1.5">
              <label htmlFor={id} className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>
              <input
                id={id}
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                style={inputStyle}
                placeholder={label}
              />
            </div>
          ))}

          {msg && (
            <p className="text-xs" style={{ color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }} role="alert">
              {msg.text}
            </p>
          )}

          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            비밀번호는 최소 6자 이상이어야 합니다.
          </p>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
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
