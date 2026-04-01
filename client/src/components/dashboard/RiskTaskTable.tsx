import { useNavigate } from 'react-router-dom';
import type { Task } from '../../types';
import RiskBadge from '../common/RiskBadge';
import ProgressBar from '../common/ProgressBar';
import EmptyState from '../common/EmptyState';
import { formatDate, formatPercent } from '../../lib/utils';

interface RiskTaskTableProps {
  tasks: Task[];
}

export default function RiskTaskTable({ tasks }: RiskTaskTableProps) {
  const navigate = useNavigate();
  const riskTasks = tasks
    .filter((t) => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL')
    .sort((a, b) => {
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (order[a.riskLevel] ?? 9) - (order[b.riskLevel] ?? 9);
    })
    .slice(0, 10);

  if (riskTasks.length === 0) {
    return (
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h3 className="text-sm font-semibold mb-3">위험 일감</h3>
        <EmptyState title="위험 일감이 없습니다" description="모든 일감이 정상 진행중입니다." />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 className="text-sm font-semibold mb-3">위험 일감</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: 'var(--color-text-secondary)' }}>
              <th className="text-left py-2 px-2 font-medium text-xs">프로젝트</th>
              <th className="text-left py-2 px-2 font-medium text-xs">업무명</th>
              <th className="text-left py-2 px-2 font-medium text-xs">담당자</th>
              <th className="text-right py-2 px-2 font-medium text-xs">실제</th>
              <th className="text-right py-2 px-2 font-medium text-xs">기대</th>
              <th className="text-right py-2 px-2 font-medium text-xs">갭</th>
              <th className="text-left py-2 px-2 font-medium text-xs">마감일</th>
              <th className="text-left py-2 px-2 font-medium text-xs">위험도</th>
            </tr>
          </thead>
          <tbody>
            {riskTasks.map((t) => {
              const gap = t.progressTotal - t.expectedProgress;
              return (
                <tr
                  key={t.id}
                  className="cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <td className="py-2 px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.project?.name || '-'}
                  </td>
                  <td className="py-2 px-2 truncate max-w-48">{t.title}</td>
                  <td className="py-2 px-2 text-xs">{t.assignee?.name || '-'}</td>
                  <td className="py-2 px-2 text-right">
                    <ProgressBar value={t.progressTotal} height="h-1" showLabel />
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                    {formatPercent(t.expectedProgress)}
                  </td>
                  <td
                    className="py-2 px-2 text-right tabular-nums font-medium"
                    style={{ color: gap < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
                  >
                    {gap > 0 ? '+' : ''}{formatPercent(gap)}
                  </td>
                  <td className="py-2 px-2 text-xs tabular-nums">{formatDate(t.dueDate)}</td>
                  <td className="py-2 px-2"><RiskBadge level={t.riskLevel} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
