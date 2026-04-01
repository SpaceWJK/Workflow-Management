import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import TaskTestTypeRepeater from './TaskTestTypeRepeater';
import TaskProgressEditor from './TaskProgressEditor';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTask, useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useTeam } from '../../hooks/useTeam';
import { PRIORITY_MAP, TASK_STATUS_MAP, type Priority, type TaskStatus, type TaskTestType } from '../../types';
import dayjs from 'dayjs';

interface FormData {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string;
  priority: Priority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  progressTotal: number;
  memo: string;
  testTypes: Partial<TaskTestType>[];
}

const INITIAL: FormData = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  priority: 'NORMAL',
  status: 'PENDING',
  startDate: dayjs().format('YYYY-MM-DD'),
  dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  progressTotal: 0,
  memo: '',
  testTypes: [],
};

export default function TaskFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingTask, isLoading: taskLoading } = useTask(id ? Number(id) : undefined);
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useTeam();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && existingTask) {
      setForm({
        title: existingTask.title,
        description: existingTask.description || '',
        projectId: String(existingTask.projectId),
        assigneeId: existingTask.assigneeId ? String(existingTask.assigneeId) : '',
        priority: existingTask.priority,
        status: existingTask.status,
        startDate: existingTask.startDate,
        dueDate: existingTask.dueDate,
        progressTotal: existingTask.progressTotal,
        memo: existingTask.memo || '',
        testTypes: existingTask.testTypes || [],
      });
    }
  }, [isEdit, existingTask]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = '업무명을 입력하세요.';
    if (!form.projectId) errs.projectId = '프로젝트를 선택하세요.';
    if (!form.startDate) errs.startDate = '시작일을 입력하세요.';
    if (!form.dueDate) errs.dueDate = '마감일을 입력하세요.';
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
      errs.dueDate = '마감일은 시작일 이후여야 합니다.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title,
      description: form.description || undefined,
      projectId: Number(form.projectId),
      assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progressTotal: form.progressTotal,
      memo: form.memo || undefined,
      testTypes: form.testTypes.length > 0 ? form.testTypes : undefined,
    };

    if (isEdit) {
      await updateTask.mutateAsync({ id: Number(id), ...payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    navigate('/tasks');
  };

  if (isEdit && taskLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg text-sm border-none outline-none';
  const inputStyle = { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' };

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-3xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? '일감 수정' : '새 일감'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section: Basic */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold mb-1">기본 정보</h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>업무명 *</label>
            <input
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="업무명을 입력하세요"
            />
            {errors.title && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.title}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>프로젝트 *</label>
              <select value={form.projectId} onChange={(e) => setField('projectId', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">선택</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.projectId && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.projectId}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>담당자</label>
              <select value={form.assigneeId} onChange={(e) => setField('assigneeId', e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">미지정</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>우선순위</label>
              <select value={form.priority} onChange={(e) => setField('priority', e.target.value as Priority)} className={inputClass} style={inputStyle}>
                {(Object.keys(PRIORITY_MAP) as Priority[]).map((k) => (
                  <option key={k} value={k}>{PRIORITY_MAP[k].label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>상태</label>
              <select value={form.status} onChange={(e) => setField('status', e.target.value as TaskStatus)} className={inputClass} style={inputStyle}>
                {(Object.keys(TASK_STATUS_MAP) as TaskStatus[]).map((k) => (
                  <option key={k} value={k}>{TASK_STATUS_MAP[k].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="업무 설명 (선택사항)"
            />
          </div>
        </div>

        {/* Section: Schedule */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold mb-1">일정 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>시작일 *</label>
              <input type="date" value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} className={inputClass} style={inputStyle} />
              {errors.startDate && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.startDate}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>마감일 *</label>
              <input type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} className={inputClass} style={inputStyle} />
              {errors.dueDate && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.dueDate}</span>}
            </div>
          </div>
        </div>

        {/* Section: Test types */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <TaskTestTypeRepeater
            testTypes={form.testTypes}
            onChange={(tt) => setField('testTypes', tt)}
          />
        </div>

        {/* Section: Progress */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <TaskProgressEditor
            value={form.progressTotal}
            onChange={(v) => setField('progressTotal', v)}
          />
        </div>

        {/* Memo */}
        <div
          className="rounded-xl p-5 flex flex-col gap-2"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <label className="text-sm font-medium">메모</label>
          <textarea
            value={form.memo}
            onChange={(e) => setField('memo', e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
            placeholder="메모 (선택사항)"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createTask.isPending || updateTask.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Save className="w-4 h-4" /> {isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
