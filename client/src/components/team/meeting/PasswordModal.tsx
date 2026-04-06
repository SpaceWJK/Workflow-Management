import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X } from 'lucide-react';
import type { MeetingRoom } from '../../../types';

interface Props {
  room: MeetingRoom | null;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}

export default function PasswordModal({ room, onClose, onSubmit }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      await onSubmit(password);
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '입장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {room && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <motion.div
            className="relative rounded-xl w-full max-w-xs p-5"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          >
            <button onClick={onClose} className="absolute top-3 right-3 cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center gap-3">
              <Lock className="w-8 h-8" style={{ color: 'var(--color-warning)' }} />
              <h3 className="text-base font-bold">{room.title}</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>비공개 회의실입니다. 비밀번호를 입력하세요.</p>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="비밀번호"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none text-center"
                style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                autoFocus
              />

              {error && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={!password || loading}
                className="w-full py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {loading ? '확인 중...' : '입장'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
