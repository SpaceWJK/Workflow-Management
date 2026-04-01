import { TEAM_STATUS_MAP, type TeamStatus, type User } from '../../types';
import { getInitials } from '../../lib/utils';

interface TeamStatusBoardProps {
  members: User[];
}

export default function TeamStatusBoard({ members }: TeamStatusBoardProps) {
  const statuses = Object.keys(TEAM_STATUS_MAP) as TeamStatus[];

  const grouped = members.reduce<Record<string, User[]>>((acc, m) => {
    const s = m.teamStatus || 'AVAILABLE';
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <h3 className="text-sm font-semibold mb-3">상태별 현황</h3>
      <div className="flex flex-col gap-3">
        {statuses.map((status) => {
          const meta = TEAM_STATUS_MAP[status];
          const group = grouped[status] || [];
          if (group.length === 0) return null;

          return (
            <div key={status} className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 w-20 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                <span className="text-xs font-medium">{meta.label}</span>
              </div>
              <span className="text-xs font-bold tabular-nums w-6" style={{ color: meta.color }}>
                {group.length}
              </span>
              <div className="flex flex-wrap gap-1">
                {group.map((m) => (
                  <div
                    key={m.id}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium"
                    style={{ backgroundColor: meta.color, color: '#fff' }}
                    title={m.name}
                  >
                    {getInitials(m.name)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
