import { useNavigate } from 'react-router-dom';
import ProgressBar from '../common/ProgressBar';
import RiskBadge from '../common/RiskBadge';
import type { Project, RiskLevel } from '../../types';
import EmptyState from '../common/EmptyState';

interface ProjectHealthListProps {
  projects: Project[];
}

function getProjectRisk(p: Project): RiskLevel {
  if (!p.taskCount || p.taskCount === 0) return 'LOW';
  const delayRatio = (p.delayedCount ?? 0) / p.taskCount;
  if (delayRatio > 0.3) return 'CRITICAL';
  if (delayRatio > 0.15) return 'HIGH';
  if (delayRatio > 0.05) return 'MEDIUM';
  return 'LOW';
}

export default function ProjectHealthList({ projects }: ProjectHealthListProps) {
  const navigate = useNavigate();

  if (!projects.length) {
    return <EmptyState title="프로젝트가 없습니다" />;
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h3 className="text-sm font-semibold mb-3">프로젝트 건강도</h3>
      <div className="flex flex-col gap-3">
        {projects.map((p) => {
          const completionRate = p.taskCount ? Math.round(((p.completedCount ?? 0) / p.taskCount) * 100) : 0;
          const risk = getProjectRisk(p);

          return (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div
                className="w-2 h-8 rounded-full shrink-0"
                style={{ backgroundColor: p.color || 'var(--color-primary)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                    {p.completedCount ?? 0}/{p.taskCount ?? 0}
                  </span>
                </div>
                <ProgressBar value={completionRate} height="h-1.5" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(p.delayedCount ?? 0) > 0 && (
                  <span className="text-xs tabular-nums" style={{ color: 'var(--color-danger)' }}>
                    {p.delayedCount} 지연
                  </span>
                )}
                <RiskBadge level={risk} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
