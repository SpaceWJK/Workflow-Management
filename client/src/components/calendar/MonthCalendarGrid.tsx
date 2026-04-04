import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { CalendarEvent, Task } from '../../types';
import { CALENDAR_EVENT_TYPE_MAP } from '../../types';
import { cn } from '../../lib/utils';


interface MonthCalendarGridProps {
  year: number;
  month: number;
  tasks: Task[];
  calendarEvents?: CalendarEvent[];
  onTaskClick?: (taskId: number) => void;
  onDateClick?: (date: string) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function MonthCalendarGrid({
  year,
  month,
  tasks,
  calendarEvents = [],
  onTaskClick,
  onDateClick,
  onEventClick,
}: MonthCalendarGridProps) {
  const calendarDays = useMemo(() => {
    const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const startOfWeek = firstDay.startOf('week'); // Sunday
    const lastDay = firstDay.endOf('month');
    const endOfWeek = lastDay.endOf('week');
    const totalDays = endOfWeek.diff(startOfWeek, 'day') + 1;

    return Array.from({ length: totalDays }, (_, i) => startOfWeek.add(i, 'day'));
  }, [year, month]);

  const today = dayjs().format('YYYY-MM-DD');

  const getTasksForDate = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return tasks.filter((t) => dateStr >= t.startDate && dateStr <= t.dueDate);
  };

  const getEventsForDate = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return calendarEvents.filter((e) => dateStr >= e.startDate && dateStr <= e.endDate);
  };

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-2"
            style={{
              color: i === 0 ? 'var(--color-danger)' : i === 6 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px" style={{ backgroundColor: 'var(--color-border)' }}>
        {calendarDays.map((day) => {
          const isCurrentMonth = day.month() + 1 === month;
          const isToday = day.format('YYYY-MM-DD') === today;
          const dateStr = day.format('YYYY-MM-DD');
          const dayTasks = getTasksForDate(day);
          const dayEvents = getEventsForDate(day);
          const totalItems = dayEvents.length + dayTasks.length;

          return (
            <div
              key={dateStr}
              className={cn('min-h-24 p-1.5 cursor-pointer transition-colors hover:brightness-95')}
              style={{
                backgroundColor: isToday
                  ? 'color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))'
                  : 'var(--color-surface)',
              }}
              onClick={() => onDateClick?.(dateStr)}
              role="button"
              aria-label={`${dateStr} 일정 추가`}
            >
              <div
                className={cn(
                  'text-xs mb-1 tabular-nums',
                  isToday && 'font-bold'
                )}
                style={{
                  color: !isCurrentMonth
                    ? 'var(--color-border)'
                    : isToday
                      ? 'var(--color-primary)'
                      : 'var(--color-text-secondary)',
                }}
              >
                {day.format('D')}
              </div>

              <div className="flex flex-col gap-0.5">
                {/* 캘린더 이벤트 (개인 일정) */}
                {dayEvents.slice(0, 2).map((e) => {
                  const meta = CALENDAR_EVENT_TYPE_MAP[e.type];
                  return (
                    <div
                      key={`ev-${e.id}`}
                      className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${meta.color} 25%, transparent)`,
                        color: meta.color,
                      }}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                      title={`[${meta.label}] ${e.title}`}
                    >
                      {meta.label}: {e.title}
                    </div>
                  );
                })}
                {/* 일감 */}
                {dayTasks.slice(0, Math.max(0, 3 - dayEvents.length)).map((t) => (
                  <div
                    key={`task-${t.id}`}
                    className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${t.project?.color || 'var(--color-primary)'} 25%, transparent)`,
                      color: t.project?.color || 'var(--color-primary)',
                    }}
                    onClick={(ev) => { ev.stopPropagation(); onTaskClick?.(t.id); }}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
                {totalItems > 3 && (
                  <span className="text-[9px]" style={{ color: 'var(--color-text-secondary)' }}>
                    +{totalItems - 3}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
