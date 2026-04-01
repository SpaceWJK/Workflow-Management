import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title = '데이터가 없습니다',
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <div className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        {icon || <Inbox className="w-12 h-12" />}
      </div>
      <h3 className="text-base font-medium mb-1" style={{ color: 'var(--color-text)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
