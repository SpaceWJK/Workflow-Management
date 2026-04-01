import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterBar from '../common/FilterBar';
import TaskTable from './TaskTable';
import EmptyState from '../common/EmptyState';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import {
  TASK_STATUS_MAP,
  PRIORITY_MAP,
  type TaskStatus,
  type Priority,
  type TaskFilter,
} from '../../types';

export default function TaskListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TaskFilter>({});

  const { data: tasks = [], isLoading } = useTasks(filter);
  const { data: projects = [] } = useProjects();

  const statusOptions = (Object.keys(TASK_STATUS_MAP) as TaskStatus[]).map((k) => ({
    value: k,
    label: TASK_STATUS_MAP[k].label,
  }));

  const priorityOptions = (Object.keys(PRIORITY_MAP) as Priority[]).map((k) => ({
    value: k,
    label: PRIORITY_MAP[k].label,
  }));

  const projectOptions = projects.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">일감 관리</h1>
        <button
          onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" /> 새 일감
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        searchValue={filter.search || ''}
        onSearchChange={(v) => setFilter((f) => ({ ...f, search: v }))}
        searchPlaceholder="일감 검색..."
        filters={[
          {
            key: 'project',
            label: '프로젝트',
            options: projectOptions,
            value: filter.projectId ? String(filter.projectId) : '',
            onChange: (v) => setFilter((f) => ({ ...f, projectId: v ? Number(v) : undefined })),
          },
          {
            key: 'status',
            label: '상태',
            options: statusOptions,
            value: filter.status || '',
            onChange: (v) => setFilter((f) => ({ ...f, status: (v as TaskStatus) || undefined })),
          },
          {
            key: 'priority',
            label: '우선순위',
            options: priorityOptions,
            value: filter.priority || '',
            onChange: (v) => setFilter((f) => ({ ...f, priority: (v as Priority) || undefined })),
          },
        ]}
      />

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" className="h-64" />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="일감이 없습니다"
          description="새 일감을 등록해 보세요."
          action={
            <button
              onClick={() => navigate('/tasks/new')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              일감 등록
            </button>
          }
        />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <TaskTable tasks={tasks} />
        </div>
      )}
    </motion.div>
  );
}
