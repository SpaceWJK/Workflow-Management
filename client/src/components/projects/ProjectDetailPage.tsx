import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useProject } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { PROJECT_STATUS_MAP } from '../../types';
import ProgressBar from '../common/ProgressBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import ProjectKanban from './ProjectKanban';
import ProjectTimeline from './ProjectTimeline';

type ViewTab = 'list' | 'kanban' | 'timeline';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: projLoading } = useProject(id ? Number(id) : undefined);
  const { data: tasks = [], isLoading: tasksLoading } = useTasks(
    id ? { projectId: Number(id) } : undefined
  );
  const [tab, setTab] = useState<ViewTab>('kanban');

  if (projLoading || tasksLoading) return <LoadingSpinner size="lg" className="h-64" />;
  if (!project) return <EmptyState title="프로젝트를 찾을 수 없습니다" />;

  const statusMeta = PROJECT_STATUS_MAP[project.status];
  const rate = project.taskCount
    ? Math.round(((project.completedCount ?? 0) / project.taskCount) * 100)
    : 0;

  const tabs: { key: ViewTab; label: string }[] = [
    { key: 'kanban', label: '칸반' },
    { key: 'list', label: '리스트' },
    { key: 'timeline', label: '타임라인' },
  ];

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]">
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: project.color || 'var(--color-primary)' }}
        />
        <h1 className="text-xl font-bold">{project.name}</h1>
        {statusMeta && (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${statusMeta.color} 20%, transparent)`,
              color: statusMeta.color,
            }}
          >
            {statusMeta.label}
          </span>
        )}
      </div>

      {/* Stats bar */}
      <div
        className="grid grid-cols-4 gap-4 rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>전체 일감</div>
          <div className="text-xl font-bold tabular-nums">{project.taskCount ?? 0}</div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>완료</div>
          <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--color-success)' }}>
            {project.completedCount ?? 0}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>지연</div>
          <div className="text-xl font-bold tabular-nums" style={{ color: 'var(--color-danger)' }}>
            {project.delayedCount ?? 0}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>완료율</div>
          <ProgressBar value={rate} height="h-2" showLabel />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === t.key ? 'var(--color-primary)' : 'transparent',
              color: tab === t.key ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {tab === 'kanban' && <ProjectKanban tasks={tasks} />}
        {tab === 'timeline' && <ProjectTimeline tasks={tasks} />}
        {tab === 'list' && (
          <div className="flex flex-col gap-2">
            {tasks.length === 0 ? (
              <EmptyState title="일감이 없습니다" />
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <span className="text-xs tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>#{t.id}</span>
                  <span className="flex-1 truncate text-sm">{t.title}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.assignee?.name || '-'}</span>
                  <ProgressBar value={t.progressTotal} height="h-1.5" showLabel className="w-24" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
