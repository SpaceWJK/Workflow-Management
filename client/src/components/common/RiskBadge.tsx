import { RISK_LEVEL_MAP, type RiskLevel } from '../../types';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export default function RiskBadge({ level, className }: RiskBadgeProps) {
  const meta = RISK_LEVEL_MAP[level];
  if (!meta) return <span>{level}</span>;

  const isCritical = level === 'CRITICAL';

  const badge = (
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
      {meta.label}
    </span>
  );

  if (isCritical) {
    return (
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="inline-flex"
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}
