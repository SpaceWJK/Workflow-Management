import { useNavigate } from 'react-router-dom';
import type { Task } from '../../types';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import ProgressBar from '../common/ProgressBar';
import { formatDate, remainingDays } from '../../lib/utils';

interface TaskTableProps {
  tasks: Task[];
}

export default function TaskTable({ tasks }: TaskTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: 'var(--color-text-secondary)' }}>
            <th className="text-left py-2.5 px-3 font-medium text-xs">ID</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">프로젝트</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">업무명</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">담당자</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">상태</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">우선순위</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs w-32">진행률</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">시작일</th>
            <th className="text-left py-2.5 px-3 font-medium text-xs">마감일</th>
            <th className="text-right py-2.5 px-3 font-medium text-xs">남은일</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const days = remainingDays(t.dueDate);
            return (
              <tr
                key={t.id}
                className="cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                style={{ borderTop: '1px solid var(--color-border)' }}
                onClick={() => navigate(`/tasks/${t.id}`)}
              >
                <td className="py-2.5 px-3 tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                  #{t.id}
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {t.project?.name || '-'}
                  </span>
                </td>
                <td className="py-2.5 px-3 truncate max-w-56">{t.title}</td>
                <td className="py-2.5 px-3 text-xs">{t.assignee?.name || '-'}</td>
                <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                <td className="py-2.5 px-3"><PriorityBadge priority={t.priority} /></td>
                <td className="py-2.5 px-3">
                  <ProgressBar value={t.progressTotal} height="h-1.5" showLabel />
                </td>
                <td className="py-2.5 px-3 tabular-nums text-xs">{formatDate(t.startDate)}</td>
                <td className="py-2.5 px-3 tabular-nums text-xs">{formatDate(t.dueDate)}</td>
                <td
                  className="py-2.5 px-3 text-right tabular-nums text-xs font-medium"
                  style={{
                    color: days < 0
                      ? 'var(--color-danger)'
                      : days <= 3
                        ? 'var(--color-warning)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {days < 0 ? `${Math.abs(days)}일 초과` : days === 0 ? '오늘' : `${days}일`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
