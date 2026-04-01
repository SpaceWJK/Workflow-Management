import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export default function KPICard({ title, value, icon, color = 'var(--color-primary)', onClick, className }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'rounded-xl p-4 cursor-pointer transition-colors',
        className
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
        {value}
      </div>
    </motion.div>
  );
}
