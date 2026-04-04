import { Plus, Trash2 } from 'lucide-react';
import type { TaskTestType } from '../../types';

interface TaskTestTypeRepeaterProps {
  testTypes: Partial<TaskTestType>[];
  onChange: (testTypes: Partial<TaskTestType>[]) => void;
}

const TEST_TYPE_OPTIONS = [
  { code: 'UPDATE',        name: '업데이트 테스트(Update)' },
  { code: 'BVT',           name: '구동 테스트(BVT)' },
  { code: 'BAT',           name: '인수 테스트(BAT)' },
  { code: 'FUNCTIONALITY', name: '기능 테스트(Functionality)' },
  { code: 'PERFORMANCE',   name: '성능 테스트' },
  { code: 'COMPATIBILITY', name: '호환 테스트(Compatibility)' },
  { code: 'LOCALIZATION',  name: '현지화 테스트(Localization)' },
  { code: 'BALANCE',       name: '밸런스 테스트(Balance)' },
];

export default function TaskTestTypeRepeater({ testTypes, onChange }: TaskTestTypeRepeaterProps) {
  const addType = () => {
    onChange([...testTypes, { testTypeCode: '', progress: 0, note: '' }]);
  };

  const removeType = (index: number) => {
    onChange(testTypes.filter((_, i) => i !== index));
  };

  const updateType = (index: number, field: string, value: string | number) => {
    const updated = testTypes.map((tt, i) =>
      i === index ? { ...tt, [field]: value } : tt
    );
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">테스트 종류</label>
        <button
          type="button"
          onClick={addType}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
          style={{ color: 'var(--color-primary)' }}
        >
          <Plus className="w-3.5 h-3.5" /> 추가
        </button>
      </div>

      {testTypes.map((tt, i) => (
        <div
          key={i}
          className="grid gap-3 p-3 rounded-lg"
          style={{
            gridTemplateColumns: '1fr 100px 1fr auto',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <select
            value={tt.testTypeCode || ''}
            onChange={(e) => updateType(i, 'testTypeCode', e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border-none outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">선택</option>
            {TEST_TYPE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>{o.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              max={100}
              value={tt.progress ?? 0}
              onChange={(e) => updateType(i, 'progress', Number(e.target.value))}
              className="w-16 px-2 py-1.5 rounded-lg text-sm text-right border-none outline-none"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>%</span>
          </div>

          <input
            type="text"
            value={tt.note || ''}
            onChange={(e) => updateType(i, 'note', e.target.value)}
            placeholder="비고"
            className="px-3 py-1.5 rounded-lg text-sm border-none outline-none"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />

          <button
            type="button"
            onClick={() => removeType(i)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
