import type { User, Task } from '../../types';

interface MemberWorkloadPanelProps {
  members: User[];
  tasks: Task[];
}

export default function MemberWorkloadPanel({ members, tasks }: MemberWorkloadPanelProps) {
  const workload = members.map((m) => ({
    member: m,
    count: tasks.filter((t) => t.assigneeId === m.id && t.status !== 'DONE').length,
  })).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...workload.map((w) => w.count));

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <h3 className="text-sm font-semibold mb-3">업무 부하</h3>
      <div className="flex flex-col gap-2">
        {workload.map(({ member, count }) => (
          <div key={member.id} className="flex items-center gap-3">
            <span className="text-xs w-16 truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {member.name}
            </span>
            <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  backgroundColor: count > 5 ? 'var(--color-danger)' : count > 3 ? 'var(--color-warning)' : 'var(--color-primary)',
                }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
