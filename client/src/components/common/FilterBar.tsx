import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  className?: string;
}

export default function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = '검색...',
  filters = [],
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn('flex items-center gap-3 p-3 rounded-xl', className)}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Search */}
      {onSearchChange && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-xs"
          style={{ backgroundColor: 'var(--color-bg)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="bg-transparent border-none outline-none text-sm w-full"
            style={{ color: 'var(--color-text)' }}
          />
        </div>
      )}

      {/* Filter selects */}
      {filters.map((f) => (
        <select
          key={f.key}
          value={f.value}
          onChange={(e) => f.onChange(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm border-none outline-none cursor-pointer"
          style={{
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
          }}
        >
          <option value="">{f.label}</option>
          {f.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
