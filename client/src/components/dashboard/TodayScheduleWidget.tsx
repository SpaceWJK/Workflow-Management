import { useState } from 'react';
import dayjs from 'dayjs';
import { Clock, Briefcase, User } from 'lucide-react';
import type { Task, CalendarEvent } from '../../types';
import { CALENDAR_EVENT_TYPE_MAP } from '../../types';
import EmptyState from '../common/EmptyState';
import StatusBadge from '../common/StatusBadge';

interface TodayScheduleWidgetProps {
  tasks: Task[];
  calendarEvents?: CalendarEvent[];
}

type ViewMode = 'project' | 'personal';

export default function TodayScheduleWidget({ tasks, calendarEvents = [] }: TodayScheduleWidgetProps) {
  const [mode, setMode] = useState<ViewMode>('project');
  const today = dayjs().format('YYYY-MM-DD');

  const todayTasks = tasks.filter((t) => {
    if (t.status === 'DONE' || t.status === 'CANCELED') return false;
    const start = t.startDate?.slice(0, 10);
    const due = t.dueDate?.slice(0, 10);
    return start && due && today >= start && today <= due;
  });

  const todayEvents = calendarEvents.filter((e) => {
    const start = e.startDate?.slice(0, 10);
    const end = e.endDate?.slice(0, 10);
    return today >= start && today <= end;
  });

  const items = mode === 'project' ? todayTasks : [];
  const events = mode === 'personal' ? todayEvents : [];
  const totalCount = mode === 'project' ? todayTasks.length : todayEvents.length;

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

        {/* 스위치 */}
        <div className="flex items-center gap-0.5 ml-auto rounded-md p-0.5" style={{ backgroundColor: 'var(--color-bg)' }}>
          <button
            onClick={() => setMode('project')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer"
            style={{
              backgroundColor: mode === 'project' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'project' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              boxShadow: mode === 'project' ? '0 1px 2px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            <Briefcase className="w-3 h-3" />
            프로젝트
          </button>
          <button
            onClick={() => setMode('personal')}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer"
            style={{
              backgroundColor: mode === 'personal' ? 'var(--color-surface)' : 'transparent',
              color: mode === 'personal' ? 'var(--color-warning)' : 'var(--color-text-secondary)',
              boxShadow: mode === 'personal' ? '0 1px 2px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            <User className="w-3 h-3" />
            개인
          </button>
        </div>

        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
          {totalCount}건
        </span>
      </div>

      {totalCount === 0 ? (
        <EmptyState
          title={mode === 'project' ? '오늘 프로젝트 일정이 없습니다' : '오늘 개인 일정이 없습니다'}
          className="py-8"
        />
      ) : mode === 'project' ? (
        <div className="flex flex-col gap-2">
          {items.map((t) => (
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
      ) : (
        <div className="flex flex-col gap-2">
          {events.map((e) => {
            const meta = CALENDAR_EVENT_TYPE_MAP[e.type];
            const personalColor = meta.color === 'var(--color-danger)' ? '#A855F7' : meta.color;
            const icon = e.type === 'VACATION' ? '🏖' : e.type === 'BUSINESS_TRIP' ? '✈' : e.type === 'HALF_DAY_AM' || e.type === 'HALF_DAY_PM' ? '⏰' : e.type === 'REMOTE' ? '🏠' : e.type === 'MEETING' ? '📋' : '📌';
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 p-2 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg)' }}
              >
                <span className="text-base shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{e.title}</div>
                  <div className="text-xs" style={{ color: personalColor }}>{meta.label}</div>
                </div>
                {e.user && (
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{e.user.name}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
