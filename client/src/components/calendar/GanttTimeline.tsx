import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import type { Task, Project } from '../../types';
import TaskTimelineBar from './TaskTimelineBar';
import TodayIndicatorLine from './TodayIndicatorLine';
import EmptyState from '../common/EmptyState';

dayjs.extend(minMax);

interface GanttTimelineProps {
  tasks: Task[];
  projects: Project[];
}

const DAY_WIDTH = 28;

export default function GanttTimeline({ tasks, projects }: GanttTimelineProps) {
  if (!tasks.length) return <EmptyState title="일감이 없습니다" />;

  const allDates = tasks.flatMap((t) => [dayjs(t.startDate), dayjs(t.dueDate)]);
  const minDate = dayjs.min(...allDates)!.subtract(2, 'day').startOf('day');
  const maxDate = dayjs.max(...allDates)!.add(2, 'day').endOf('day');
  const totalDays = maxDate.diff(minDate, 'day') + 1;

  // Group tasks by project
  const grouped = projects
    .map((p) => ({
      project: p,
      tasks: tasks.filter((t) => t.projectId === p.id),
    }))
    .filter((g) => g.tasks.length > 0);

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ minWidth: `${totalDays * DAY_WIDTH}px` }}>
        {/* Date row */}
        <div
          className="grid sticky top-0 z-10"
          style={{
            gridTemplateColumns: `repeat(${totalDays}, ${DAY_WIDTH}px)`,
            backgroundColor: 'var(--color-surface)',
          }}
        >
          {Array.from({ length: totalDays }, (_, i) => {
            const d = minDate.add(i, 'day');
            const isToday = d.isSame(dayjs(), 'day');
            const isWeekend = d.day() === 0 || d.day() === 6;
            const isFirst = d.date() === 1 || i === 0;

            return (
              <div
                key={i}
                className="text-center border-r"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: isToday
                    ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)'
                    : isWeekend
                      ? 'var(--color-surface-hover)'
                      : undefined,
                }}
              >
                {isFirst && (
                  <div className="text-[9px] font-medium py-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {d.format('MMM')}
                  </div>
                )}
                <div
                  className="text-[10px] py-0.5 tabular-nums"
                  style={{
                    color: isToday ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {d.format('DD')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today line */}
        <TodayIndicatorLine startDate={minDate} dayWidth={DAY_WIDTH} />

        {/* Project groups */}
        {grouped.map((g) => (
          <div key={g.project.id} className="mt-2">
            <div
              className="flex items-center gap-2 px-2 py-1 text-xs font-semibold sticky left-0"
              style={{ color: g.project.color || 'var(--color-primary)' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: g.project.color || 'var(--color-primary)' }}
              />
              {g.project.name}
            </div>
            {g.tasks.map((t) => (
              <div key={t.id} className="relative h-7">
                <TaskTimelineBar task={t} startDate={minDate} dayWidth={DAY_WIDTH} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
