import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isPending?: boolean;
}

export default function RejectionModal({
  isOpen,
  onClose,
  onSubmit,
  isPending = false,
}: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 모달 열릴 때 초기화 + 포커스
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('반려 사유를 입력해 주세요.');
      return;
    }
    onSubmit(reason.trim());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="rejection-modal-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative rounded-xl p-6 w-full max-w-md"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
              <h3 id="rejection-modal-title" className="text-base font-semibold">빌드 반려</h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="rejection-reason"
                  className="text-xs font-medium"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  반려 사유 <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <textarea
                  id="rejection-reason"
                  ref={textareaRef}
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setError(''); }}
                  rows={4}
                  placeholder="반려 사유를 입력해 주세요."
                  className="px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    color: 'var(--color-text)',
                  }}
                />
                {error && (
                  <p className="text-xs" style={{ color: 'var(--color-danger)' }} role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                >
                  반려 확정
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
