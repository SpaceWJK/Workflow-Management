import { TEAM_STATUS_MAP, type User } from '../../types';
import { getInitials } from '../../lib/utils';

interface ProjectMember {
  project?: { id: number; name: string };
}

interface ExtendedUser extends User {
  projectMembers?: ProjectMember[];
}

interface TeamMemberCardProps {
  member: ExtendedUser;
  taskCount?: number;
  dueTodayCount?: number;
}

export default function TeamMemberCard({ member, taskCount = 0, dueTodayCount = 0 }: TeamMemberCardProps) {
  const statusMeta = TEAM_STATUS_MAP[member.teamStatus] || TEAM_STATUS_MAP.AVAILABLE;

  const projects = member.projectMembers
    ?.map((pm) => pm.project)
    .filter((p): p is { id: number; name: string } => !!p) ?? [];

  return (
    <div
      className="rounded-xl p-4 transition-colors hover:bg-[var(--color-surface-hover)]"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            {getInitials(member.name)}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              backgroundColor: statusMeta.color,
              borderColor: 'var(--color-surface)',
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="text-sm font-medium truncate">{member.name}</div>
            {member.team && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-info) 20%, transparent)',
                  color: 'var(--color-info)',
                }}
              >
                {member.team}
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.role}</div>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, ${statusMeta.color} 20%, transparent)`,
            color: statusMeta.color,
          }}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* 담당 프로젝트 칩 */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {projects.map((p) => (
            <span
              key={p.id}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              {p.name}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="text-lg font-bold tabular-nums">{taskCount}</div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>진행중</div>
        </div>
        <div className="p-2 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div
            className="text-lg font-bold tabular-nums"
            style={{ color: dueTodayCount > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}
          >
            {dueTodayCount}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>오늘 마감</div>
        </div>
      </div>
    </div>
  );
}
