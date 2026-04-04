import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<TaskFilter>({});

  // URL 쿼리 파라미터로 초기 필터 설정
  useEffect(() => {
    const status = searchParams.get('status') as TaskStatus | null;
    const riskLevel = searchParams.get('riskLevel');
    const dueToday = searchParams.get('dueToday');

    if (status) {
      setFilter((f) => ({ ...f, status }));
    }
    if (riskLevel || dueToday) {
      // 특수 필터 — 서버 필터 대신 클라이언트에서 처리
      setFilter({});
    }
  }, []); // 최초 마운트 시만

  const { data: tasks = [], isLoading } = useTasks(filter);
  const { data: projects = [] } = useProjects();

  // 클라이언트 사이드 특수 필터
  const displayTasks = useMemo(() => {
    const riskLevel = searchParams.get('riskLevel');
    const dueToday = searchParams.get('dueToday');
    const today = dayjs().format('YYYY-MM-DD');

    if (riskLevel === 'OVERDUE') {
      // 마감일 초과 + 미완료 일감
      return tasks.filter((t) => {
        if (t.status === 'DONE' || t.status === 'CANCELED') return false;
        const due = t.dueDate?.slice(0, 10);
        return due && due < today;
      });
    }
    if (dueToday === 'true') {
      // 오늘 마감 일감
      return tasks.filter((t) => {
        if (t.status === 'DONE' || t.status === 'CANCELED') return false;
        return t.dueDate?.slice(0, 10) === today;
      });
    }
    return tasks;
  }, [tasks, searchParams]);

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

  // 특수 필터 활성 여부
  const specialFilter = searchParams.get('riskLevel') || searchParams.get('dueToday');
  const specialLabel = searchParams.get('riskLevel') === 'OVERDUE' ? '지연 일감' : searchParams.get('dueToday') === 'true' ? '오늘 마감' : null;

  const clearSpecialFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('riskLevel');
    params.delete('dueToday');
    params.delete('status');
    setSearchParams(params);
    setFilter({});
  };

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">일감 관리</h1>
          {specialFilter && specialLabel && (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-danger) 20%, var(--color-surface))',
                  color: 'var(--color-danger)',
                }}
              >
                {specialLabel} ({displayTasks.length}건)
              </span>
              <button
                onClick={clearSpecialFilter}
                className="text-xs cursor-pointer hover:opacity-80"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ✕ 초기화
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 cursor-pointer"
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
            onChange: (v) => {
              setFilter((f) => ({ ...f, status: (v as TaskStatus) || undefined }));
              // 상태 필터 변경 시 특수 필터 해제
              if (specialFilter) clearSpecialFilter();
            },
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
      ) : displayTasks.length === 0 ? (
        <EmptyState
          title={specialLabel ? `${specialLabel}이 없습니다` : '일감이 없습니다'}
          description={specialLabel ? undefined : '새 일감을 등록해 보세요.'}
          action={!specialLabel ? (
            <button
              onClick={() => navigate('/tasks/new')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              일감 등록
            </button>
          ) : undefined}
        />
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <TaskTable tasks={displayTasks} />
        </div>
      )}
    </motion.div>
  );
}
