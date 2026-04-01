import { useNavigate } from 'react-router-dom';
import { TASK_STATUS_MAP, type Task, type TaskStatus } from '../../types';
import PriorityBadge from '../common/PriorityBadge';

interface ProjectKanbanProps {
  tasks: Task[];
}

const KANBAN_COLUMNS: TaskStatus[] = ['BACKLOG', 'PENDING', 'READY', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'ON_HOLD', 'DONE', 'DELAYED', 'CANCELED'];

export default function ProjectKanban({ tasks }: ProjectKanbanProps) {
  const navigate = useNavigate();

  const grouped = KANBAN_COLUMNS.reduce<Record<TaskStatus, Task[]>>((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <div
      className="grid gap-3 overflow-x-auto pb-2"
      style={{ gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, minmax(200px, 1fr))` }}
    >
      {KANBAN_COLUMNS.map((status) => {
        const meta = TASK_STATUS_MAP[status];
        const columnTasks = grouped[status] || [];

        return (
          <div key={status} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center gap-2 px-2 py-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-xs font-semibold">{meta.label}</span>
              <span
                className="text-xs font-bold ml-auto tabular-nums"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {columnTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div
              className="flex flex-col gap-2 rounded-lg p-2 min-h-32"
              style={{ backgroundColor: 'var(--color-bg)' }}
            >
              {columnTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg p-3 cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                  }}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <div className="text-sm mb-2 line-clamp-2">{t.title}</div>
                  <div className="flex items-center justify-between">
                    <PriorityBadge priority={t.priority} />
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                      {t.progressTotal}%
                    </span>
                  </div>
                  {t.assignee && (
                    <div className="text-[10px] mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                      {t.assignee.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
