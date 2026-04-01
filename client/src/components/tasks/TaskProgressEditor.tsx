import ProgressBar from '../common/ProgressBar';
import { formatPercent } from '../../lib/utils';

interface TaskProgressEditorProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

export default function TaskProgressEditor({ value, onChange, label = '전체 진행률' }: TaskProgressEditorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>
          {formatPercent(value)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-primary)]"
      />
      <ProgressBar value={value} height="h-2" color="var(--color-primary)" />
    </div>
  );
}
