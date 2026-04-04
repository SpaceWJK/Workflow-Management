import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Trash2 } from 'lucide-react';
import {
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from '../../hooks/useCalendarEvents';
import {
  CALENDAR_EVENT_TYPE_MAP,
  type CalendarEvent,
  type CalendarEventType,
} from '../../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  defaultDate?: string;
}

const EVENT_TYPES = Object.keys(CALENDAR_EVENT_TYPE_MAP) as CalendarEventType[];

interface FormState {
  title: string;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  memo: string;
}

function buildInitial(event?: CalendarEvent, defaultDate?: string): FormState {
  if (event) {
    return {
      title: event.title,
      type: event.type,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      memo: event.memo ?? '',
    };
  }
  const date = defaultDate ?? new Date().toISOString().slice(0, 10);
  return {
    title: '',
    type: 'OTHER',
    startDate: date,
    endDate: date,
    allDay: true,
    memo: '',
  };
}

export default function EventModal({ isOpen, onClose, event, defaultDate }: EventModalProps) {
  const [form, setForm] = useState<FormState>(() => buildInitial(event, defaultDate));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const isPending = createEvent.isPending || updateEvent.isPending || deleteEvent.isPending;
  const isEdit = !!event;

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitial(event, defaultDate));
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [isOpen, event, defaultDate]);

  // ESC 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) errs.title = '제목을 입력해 주세요.';
    if (!form.startDate) errs.startDate = '시작일을 입력해 주세요.';
    if (!form.endDate) errs.endDate = '종료일을 입력해 주세요.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = '종료일은 시작일 이후여야 합니다.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title.trim(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      allDay: form.allDay,
      memo: form.memo.trim() || undefined,
    };

    if (isEdit && event) {
      await updateEvent.mutateAsync({ id: event.id, ...payload });
    } else {
      await createEvent.mutateAsync(payload);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!event) return;
    await deleteEvent.mutateAsync(event.id);
    onClose();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
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
          aria-labelledby="event-modal-title"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

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
            <div className="flex items-center gap-2 mb-5">
              <CalendarDays className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h3 id="event-modal-title" className="text-base font-semibold">
                {isEdit ? '일정 수정' : '일정 추가'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* 제목 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="event-title" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  제목 <span style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: `1px solid ${errors.title ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    color: 'var(--color-text)',
                  }}
                  placeholder="일정 제목"
                />
                {errors.title && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.title}</p>}
              </div>

              {/* 유형 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="event-type" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  유형
                </label>
                <select
                  id="event-type"
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as CalendarEventType)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{CALENDAR_EVENT_TYPE_MAP[t].label}</option>
                  ))}
                </select>
              </div>

              {/* 날짜 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-start" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    시작일 <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id="event-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: `1px solid ${errors.startDate ? 'var(--color-danger)' : 'var(--color-border)'}`,
                      color: 'var(--color-text)',
                    }}
                  />
                  {errors.startDate && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.startDate}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="event-end" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    종료일 <span style={{ color: 'var(--color-danger)' }}>*</span>
                  </label>
                  <input
                    id="event-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg)',
                      border: `1px solid ${errors.endDate ? 'var(--color-danger)' : 'var(--color-border)'}`,
                      color: 'var(--color-text)',
                    }}
                  />
                  {errors.endDate && <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.endDate}</p>}
                </div>
              </div>

              {/* 종일 여부 */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => set('allDay', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">종일</span>
              </label>

              {/* 메모 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="event-memo" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  메모
                </label>
                <textarea
                  id="event-memo"
                  value={form.memo}
                  onChange={(e) => set('memo', e.target.value)}
                  rows={2}
                  className="px-3 py-2 rounded-lg text-sm outline-none resize-none"
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  placeholder="메모 (선택)"
                />
              </div>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between mt-1">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    삭제
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
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
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {isEdit ? '저장' : '추가'}
                  </button>
                </div>
              </div>
            </form>

            {/* 삭제 확인 */}
            {showDeleteConfirm && (
              <div
                className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-4 p-6"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <p className="text-sm text-center">
                  <strong>{event?.title}</strong> 일정을 삭제하시겠습니까?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
