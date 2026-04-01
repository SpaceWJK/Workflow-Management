import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjects } from '../../hooks/useProjects';
import { PROJECT_STATUS_MAP, type ProjectStatus } from '../../types';
import ProgressBar from '../common/ProgressBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

export default function ProjectListPage() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = statusFilter
    ? projects.filter((p) => p.status === statusFilter)
    : projects;

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">프로젝트</h1>
        <div className="flex items-center gap-2">
          {(['', ...Object.keys(PROJECT_STATUS_MAP)] as Array<'' | ProjectStatus>).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: statusFilter === s ? 'var(--color-primary)' : 'var(--color-surface)',
                color: statusFilter === s ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {s === '' ? '전체' : PROJECT_STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="프로젝트가 없습니다" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((p) => {
            const rate = p.taskCount ? Math.round(((p.completedCount ?? 0) / p.taskCount) * 100) : 0;
            const statusMeta = PROJECT_STATUS_MAP[p.status];

            return (
              <motion.div
                key={p.id}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl p-5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color || 'var(--color-primary)' }}
                  />
                  <span className="font-medium truncate">{p.name}</span>
                </div>

                {statusMeta && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-3"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${statusMeta.color} 20%, transparent)`,
                      color: statusMeta.color,
                    }}
                  >
                    {statusMeta.label}
                  </span>
                )}

                {p.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {p.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>완료율</span>
                  <span className="tabular-nums">{rate}%</span>
                </div>
                <ProgressBar value={rate} height="h-1.5" />

                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <div>
                    <div className="text-lg font-bold tabular-nums">{p.taskCount ?? 0}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>전체</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
                      {p.completedCount ?? 0}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>완료</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--color-danger)' }}>
                      {p.delayedCount ?? 0}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>지연</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
