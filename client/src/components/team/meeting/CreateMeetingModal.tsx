import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Globe } from 'lucide-react';
import type { User } from '../../../types';
import { useCreateMeeting } from '../../../hooks/useMeetingRooms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  presentMembers: User[];
  currentUserId: number;
  onCreated?: (roomId: number) => void;
}

export default function CreateMeetingModal({ isOpen, onClose, presentMembers, currentUserId, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const createMeeting = useCreateMeeting();

  // 모달 열릴 때마다 값 초기화 (브라우저 autofill 방지)
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setIsPrivate(false);
      setPassword('');
      setSelectedIds([]);
    }
  }, [isOpen]);

  const invitableMembers = useMemo(() =>
    presentMembers.filter((m) => m.id !== currentUserId),
    [presentMembers, currentUserId]
  );

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (isPrivate && password.length < 4) return;

    const result = await createMeeting.mutateAsync({
      title: title.trim(),
      isPrivate,
      password: isPrivate ? password : undefined,
      inviteeIds: selectedIds.length > 0 ? selectedIds : undefined,
    });

    if (result.data?.id && onCreated) {
      onCreated(result.data.id);
    }

    setTitle('');
    setIsPrivate(false);
    setPassword('');
    setSelectedIds([]);
    onClose();
  };

  const toggleInvitee = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />
          <motion.div
            className="relative rounded-xl w-full max-w-md overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="text-base font-bold">회의실 만들기</h3>
              <button onClick={onClose} className="cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}><X className="w-5 h-5" /></button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              {/* 제목 */}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>회의실 제목</label>
                <input
                  name="meeting-title"
                  autoComplete="off"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 기획 회의, QA 리뷰"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                  maxLength={100}
                />
              </div>

              {/* 공개/비공개 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPrivate(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                  style={{
                    backgroundColor: !isPrivate ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'transparent',
                    color: !isPrivate ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    border: `1px solid ${!isPrivate ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  }}
                >
                  <Globe className="w-4 h-4" /> 공개
                </button>
                <button
                  onClick={() => setIsPrivate(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm cursor-pointer"
                  style={{
                    backgroundColor: isPrivate ? 'color-mix(in srgb, var(--color-warning) 15%, transparent)' : 'transparent',
                    color: isPrivate ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                    border: `1px solid ${isPrivate ? 'var(--color-warning)' : 'var(--color-border)'}`,
                  }}
                >
                  <Lock className="w-4 h-4" /> 비공개
                </button>
              </div>

              {/* 비밀번호 (비공개 시) */}
              {isPrivate && (
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>비밀번호 (4~20자)</label>
                  <input
                    type="password"
                    name="meeting-password"
                    autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    minLength={4} maxLength={20}
                  />
                </div>
              )}

              {/* 초대 인원 */}
              {invitableMembers.length > 0 && (
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
                    초대 인원 (선택)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {invitableMembers.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => toggleInvitee(m.id)}
                        className="px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors"
                        style={{
                          backgroundColor: selectedIds.includes(m.id)
                            ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                            : 'var(--color-bg)',
                          color: selectedIds.includes(m.id) ? 'var(--color-primary)' : 'var(--color-text)',
                          border: `1px solid ${selectedIds.includes(m.id) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        }}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 flex justify-end gap-2" style={{ borderTop: '1px solid var(--color-border)' }}>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                style={{ color: 'var(--color-text-secondary)' }}>
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || (isPrivate && password.length < 4) || createMeeting.isPending}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
              >
                {createMeeting.isPending ? '생성 중...' : '만들기'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
