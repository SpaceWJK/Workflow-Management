import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  color = 'var(--color-primary)',
  height = 'h-2',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('flex-1 rounded-full overflow-hidden', height)}
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <motion.div
          className={cn('h-full rounded-full', height)}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
