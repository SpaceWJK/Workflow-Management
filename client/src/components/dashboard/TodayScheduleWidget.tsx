import dayjs from 'dayjs';
import { Clock } from 'lucide-react';
import type { Task } from '../../types';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';

interface TodayScheduleWidgetProps {
  tasks: Task[];
}

export default function TodayScheduleWidget({ tasks }: TodayScheduleWidgetProps) {
  const today = dayjs().format('YYYY-MM-DD');
  const todayTasks = tasks.filter(
    (t) => t.dueDate === today || t.startDate === today
  );

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
        <h3 className="text-sm font-semibold">오늘 일정</h3>
        <span className="text-xs tabular-nums ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
          {todayTasks.length}건
        </span>
      </div>

      {todayTasks.length === 0 ? (
        <EmptyState title="오늘 일정이 없습니다" className="py-8" />
      ) : (
        <div className="flex flex-col gap-2">
          {todayTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-2 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <div
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: t.project?.color || 'var(--color-primary)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{t.title}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {t.project?.name || '프로젝트'}
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
