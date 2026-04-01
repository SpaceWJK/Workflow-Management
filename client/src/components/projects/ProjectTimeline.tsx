import dayjs from 'dayjs';
import type { Task } from '../../types';
import { calcRequiredVelocity, getVelocityColor, formatPercent } from '../../lib/utils';
import { motion } from 'framer-motion';

interface ProjectTimelineProps {
  tasks: Task[];
}

export default function ProjectTimeline({ tasks }: ProjectTimelineProps) {
  if (!tasks.length) return null;

  // Determine date range
  const allDates = tasks.flatMap((t) => [dayjs(t.startDate), dayjs(t.dueDate)]);
  const minDate = dayjs.min(...allDates)!.startOf('day');
  const maxDate = dayjs.max(...allDates)!.endOf('day');
  const totalDays = maxDate.diff(minDate, 'day') + 1;
  const today = dayjs().startOf('day');
  const todayOffset = today.diff(minDate, 'day');

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ minWidth: `${totalDays * 32}px` }}>
        {/* Date headers */}
        <div
          className="grid text-[10px] mb-2"
          style={{
            gridTemplateColumns: `repeat(${totalDays}, 32px)`,
            color: 'var(--color-text-secondary)',
          }}
        >
          {Array.from({ length: totalDays }, (_, i) => {
            const d = minDate.add(i, 'day');
            const isWeekend = d.day() === 0 || d.day() === 6;
            return (
              <div
                key={i}
                className="text-center py-1"
                style={{
                  backgroundColor: isWeekend ? 'var(--color-surface-hover)' : undefined,
                }}
              >
                {d.format('DD')}
              </div>
            );
          })}
        </div>

        {/* Today line */}
        {todayOffset >= 0 && todayOffset < totalDays && (
          <div
            className="absolute top-0 bottom-0 w-0.5 z-10"
            style={{
              left: `${todayOffset * 32 + 16}px`,
              backgroundColor: 'var(--color-danger)',
            }}
          />
        )}

        {/* Task bars */}
        <div className="flex flex-col gap-1">
          {tasks.map((t) => {
            const start = dayjs(t.startDate).diff(minDate, 'day');
            const duration = dayjs(t.dueDate).diff(dayjs(t.startDate), 'day') + 1;
            const velocity = calcRequiredVelocity(t.progressTotal, t.dueDate);
            const barColor = getVelocityColor(velocity);

            return (
              <div key={t.id} className="relative h-8 flex items-center">
                <div
                  className="absolute h-6 rounded overflow-hidden"
                  style={{
                    left: `${start * 32}px`,
                    width: `${duration * 32}px`,
                    backgroundColor: `color-mix(in srgb, ${barColor} 30%, transparent)`,
                    border: `1px solid ${barColor}`,
                  }}
                >
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: barColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.progressTotal}%` }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium truncate">
                    {t.title} ({formatPercent(t.progressTotal)})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
