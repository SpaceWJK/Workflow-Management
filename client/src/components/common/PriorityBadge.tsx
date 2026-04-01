import { PRIORITY_MAP, type Priority } from '../../types';
import { cn } from '../../lib/utils';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export default function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const meta = PRIORITY_MAP[priority];
  if (!meta) return <span>{priority}</span>;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${meta.color} 20%, transparent)`,
        color: meta.color,
      }}
    >
      {meta.label}
    </span>
  );
}
