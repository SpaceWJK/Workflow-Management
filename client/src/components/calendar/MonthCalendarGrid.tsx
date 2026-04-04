import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { CalendarEvent, Task } from '../../types';
import { CALENDAR_EVENT_TYPE_MAP } from '../../types';
import { cn } from '../../lib/utils';
import { getHolidayMap } from '../../lib/holidays';


interface MonthCalendarGridProps {
  year: number;
  month: number;
  tasks: Task[];
  calendarEvents?: CalendarEvent[];
  todayFlash?: boolean;
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
  todayFlash = false,
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

  // 공휴일 맵 (현재 표시 연도 기준)
  const holidayMap = useMemo(() => getHolidayMap(year), [year]);

  const getTasksForDate = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return tasks.filter((t) => dateStr >= t.startDate && dateStr <= t.dueDate);
  };

  const getEventsForDate = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    return calendarEvents.filter((e) => {
      const start = e.startDate.slice(0, 10);
      const end = e.endDate.slice(0, 10);
      return dateStr >= start && dateStr <= end;
    });
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
          const holidayName = holidayMap.get(dateStr);
          const isSunday = day.day() === 0;
          const isSaturday = day.day() === 6;
          const isHoliday = !!holidayName;
          const MAX_VISIBLE = 6;
          const totalItems = dayEvents.length + dayTasks.length;

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-32 p-1.5 cursor-pointer transition-colors hover:brightness-95',
                isToday && todayFlash && 'animate-pulse'
              )}
              style={{
                backgroundColor: isToday
                  ? 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))'
                  : (isCurrentMonth && isHoliday)
                    ? 'color-mix(in srgb, var(--color-danger) 5%, var(--color-surface))'
                    : 'var(--color-surface)',
                ...(isToday ? { boxShadow: 'inset 0 0 0 2px var(--color-primary)' } : {}),
              }}
              onClick={() => onDateClick?.(dateStr)}
              role="button"
              aria-label={`${dateStr} 일정 추가`}
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span
                  className={cn(
                    'text-xs tabular-nums',
                    isToday && 'font-bold'
                  )}
                  style={{
                    color: !isCurrentMonth
                      ? 'var(--color-border)'
                      : isToday
                        ? 'var(--color-primary)'
                        : (isHoliday || isSunday)
                          ? 'var(--color-danger)'
                          : isSaturday
                            ? 'var(--color-primary)'
                            : 'var(--color-text-secondary)',
                  }}
                >
                  {day.format('D')}
                </span>
                {isCurrentMonth && holidayName && (
                  <span
                    className="text-[11px] truncate"
                    style={{ color: 'var(--color-danger)' }}
                    title={holidayName}
                  >
                    {holidayName}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5">
                {/* 개인 일정 — 점선 테두리 + 아이콘으로 프로젝트와 차별화 */}
                {dayEvents.slice(0, MAX_VISIBLE).map((e) => {
                  const meta = CALENDAR_EVENT_TYPE_MAP[e.type];
                  // 개인 일정은 빨간색 사용 금지 — 보라/주황/초록 계열 사용
                  const personalColor = meta.color === 'var(--color-danger)' ? '#A855F7' : meta.color;
                  const icon = e.type === 'VACATION' ? '🏖' : e.type === 'BUSINESS_TRIP' ? '✈' : e.type === 'HALF_DAY_AM' || e.type === 'HALF_DAY_PM' ? '⏰' : e.type === 'REMOTE' ? '🏠' : e.type === 'MEETING' ? '📋' : '📌';
                  return (
                    <div
                      key={`ev-${e.id}`}
                      className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: 'transparent',
                        color: personalColor,
                        border: `1px dashed ${personalColor}`,
                      }}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                      title={`[${meta.label}] ${e.title}`}
                    >
                      {icon} {e.title}
                    </div>
                  );
                })}
                {/* 프로젝트 일감 — 좌측 컬러 보더 + 진행율 바 */}
                {dayTasks.slice(0, Math.max(0, MAX_VISIBLE - dayEvents.length)).map((t) => {
                  const projColor = t.project?.color || 'var(--color-primary)';
                  const progress = t.progressTotal ?? 0;
                  return (
                    <div
                      key={`task-${t.id}`}
                      className="relative text-xs px-1.5 py-0.5 rounded truncate cursor-pointer transition-colors hover:opacity-80 overflow-hidden"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${projColor} 15%, transparent)`,
                        color: projColor,
                        borderLeft: `3px solid ${projColor}`,
                      }}
                      onClick={(ev) => { ev.stopPropagation(); onTaskClick?.(t.id); }}
                      title={`[${t.project?.name || ''}] ${t.title} (${progress}%)`}
                    >
                      {/* 진행율 배경 바 */}
                      <div
                        className="absolute inset-y-0 left-0 opacity-15 pointer-events-none"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: projColor,
                        }}
                      />
                      <span className="relative">{t.title}</span>
                    </div>
                  );
                })}
                {totalItems > MAX_VISIBLE && (
                  <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                    +{totalItems - MAX_VISIBLE}
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
