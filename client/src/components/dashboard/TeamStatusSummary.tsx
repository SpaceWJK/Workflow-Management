import { TEAM_STATUS_MAP, type TeamStatus, type User } from '../../types';
import { getInitials } from '../../lib/utils';
import EmptyState from '../common/EmptyState';

interface TeamStatusSummaryProps {
  members: User[];
}

export default function TeamStatusSummary({ members }: TeamStatusSummaryProps) {
  if (!members.length) {
    return <EmptyState title="팀원 정보가 없습니다" />;
  }

  const grouped = members.reduce<Record<string, User[]>>((acc, m) => {
    const status = m.teamStatus || 'AVAILABLE';
    if (!acc[status]) acc[status] = [];
    acc[status].push(m);
    return acc;
  }, {});

  const statuses = Object.keys(TEAM_STATUS_MAP) as TeamStatus[];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 className="text-sm font-semibold mb-3">팀원 상태</h3>
      <div className="grid grid-cols-3 gap-3">
        {statuses.map((status) => {
          const meta = TEAM_STATUS_MAP[status];
          const group = grouped[status] || [];

          return (
            <div
              key={status}
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  {meta.label}
                </span>
                <span className="text-xs font-bold ml-auto tabular-nums" style={{ color: meta.color }}>
                  {group.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {group.slice(0, 5).map((m) => (
                  <div
                    key={m.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium"
                    style={{ backgroundColor: meta.color, color: '#fff' }}
                    title={m.name}
                  >
                    {getInitials(m.name)}
                  </div>
                ))}
                {group.length > 5 && (
                  <span className="text-[10px] ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                    +{group.length - 5}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
