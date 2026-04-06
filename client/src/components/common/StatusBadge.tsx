import { TASK_STATUS_MAP, TEAM_STATUS_MAP, type TaskStatus, type TeamStatus } from '../../types';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: TaskStatus | TeamStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = (TASK_STATUS_MAP as Record<string, { label: string; color: string }>)[status]
    ?? (TEAM_STATUS_MAP as Record<string, { label: string; color: string }>)[status];
  if (!meta) return <span>{status}</span>;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${meta.color} 20%, transparent)`,
        color: meta.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </span>
  );
}
