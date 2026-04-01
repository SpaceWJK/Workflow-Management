import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import type { Task } from '../../types';
import { calcRequiredVelocity, getVelocityColor, formatPercent } from '../../lib/utils';

interface TaskTimelineBarProps {
  task: Task;
  startDate: dayjs.Dayjs;
  dayWidth: number;
}

export default function TaskTimelineBar({ task, startDate, dayWidth }: TaskTimelineBarProps) {
  const taskStart = dayjs(task.startDate);
  const taskEnd = dayjs(task.dueDate);
  const offset = taskStart.diff(startDate, 'day');
  const duration = taskEnd.diff(taskStart, 'day') + 1;
  const velocity = calcRequiredVelocity(task.progressTotal, task.dueDate);
  const barColor = getVelocityColor(velocity);
  const isBehind = task.progressTotal < task.expectedProgress;

  return (
    <motion.div
      className="absolute h-5 rounded overflow-hidden cursor-pointer group"
      style={{
        left: `${offset * dayWidth}px`,
        width: `${duration * dayWidth}px`,
        backgroundColor: `color-mix(in srgb, ${barColor} 25%, transparent)`,
        border: `1px solid ${barColor}`,
      }}
      animate={isBehind && velocity > 25 ? { scale: [1, 1.02, 1] } : {}}
      transition={isBehind && velocity > 25 ? { repeat: Infinity, duration: 1.5 } : {}}
      title={`${task.title} - ${formatPercent(task.progressTotal)}`}
    >
      <motion.div
        className="h-full"
        style={{ backgroundColor: barColor }}
        initial={{ width: 0 }}
        animate={{ width: `${task.progressTotal}%` }}
        transition={{ duration: 0.6 }}
      />
      <span className="absolute inset-0 flex items-center px-1 text-[9px] font-medium truncate">
        {task.title}
      </span>
    </motion.div>
  );
}
