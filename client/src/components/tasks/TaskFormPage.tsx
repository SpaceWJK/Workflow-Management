import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import TaskTestTypeRepeater from './TaskTestTypeRepeater';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTask, useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useUpdateTargets, useBuildsByTarget, useLinkTasks } from '../../hooks/useBuilds';
import { PRIORITY_MAP, TASK_STATUS_MAP, type Priority, type TaskStatus, type TaskTestType } from '../../types';
import dayjs from 'dayjs';

interface FormData {
  title: string;
  description: string;
  projectId: string;
  assigneeName: string;
  priority: Priority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  memo: string;
  testTypes: Partial<TaskTestType>[];
  buildTarget: string;
  buildIds: number[];
}

const INITIAL: FormData = {
  title: '',
  description: '',
  projectId: '',
  assigneeName: '',
  priority: 'NORMAL',
  status: 'PENDING',
  startDate: dayjs().format('YYYY-MM-DD'),
  dueDate: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  memo: '',
  testTypes: [],
  buildTarget: '',
  buildIds: [],
};

export default function TaskFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingTask, isLoading: taskLoading } = useTask(id ? Number(id) : undefined);
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProjectId = form.projectId ? Number(form.projectId) : undefined;
  const { data: updateTargets = [] } = useUpdateTargets(selectedProjectId);
  const { data: targetBuilds = [] } = useBuildsByTarget(selectedProjectId, form.buildTarget || undefined);
  const linkTasks = useLinkTasks();

  useEffect(() => {
    if (isEdit && existingTask) {
      const linkedBuildIds = (existingTask.buildLinks || [])
        .map((bl: { buildId?: number; build?: { id: number } }) => bl.build?.id ?? bl.buildId)
        .filter(Boolean) as number[];
      const firstBuildTarget = (existingTask.buildLinks || [])?.[0]?.build?.updateTarget || '';
      setForm({
        title: existingTask.title,
        description: existingTask.description || '',
        projectId: String(existingTask.projectId),
        assigneeName: existingTask.assigneeName || existingTask.assignee?.name || '',
        priority: existingTask.priority,
        status: existingTask.status,
        startDate: existingTask.startDate,
        dueDate: existingTask.dueDate,
        memo: existingTask.memo || '',
        testTypes: existingTask.testTypes || [],
        buildTarget: firstBuildTarget ? dayjs(firstBuildTarget).format('YYYY-MM-DD') : '',
        buildIds: linkedBuildIds,
      });
    }
  }, [isEdit, existingTask]);

  // 전체 진행율 = 테스트종류별 진행율 평균
  const progressTotal = useMemo(() => {
    const withProgress = form.testTypes.filter((t) => t.progress !== undefined);
    if (withProgress.length === 0) return 0;
    const sum = withProgress.reduce((acc, t) => acc + (t.progress || 0), 0);
    return Math.round(sum / withProgress.length);
  }, [form.testTypes]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Reset build fields when project changes
      if (key === 'projectId') {
        next.buildTarget = '';
        next.buildIds = [];
      }
      // Reset buildIds when target changes
      if (key === 'buildTarget') {
        next.buildIds = [];
      }
      return next;
    });
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
      assigneeName: form.assigneeName || undefined,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progressTotal,
      memo: form.memo || undefined,
      testTypes: form.testTypes.length > 0 ? form.testTypes : undefined,
    };

    if (isEdit) {
      await updateTask.mutateAsync({ id: Number(id), ...payload, version: existingTask?.version ?? 0 });
    } else {
      const result = await createTask.mutateAsync(payload);
      // Link builds if selected
      if (form.buildIds.length > 0 && result.data?.id) {
        for (const buildId of form.buildIds) {
          try {
            await linkTasks.mutateAsync({ buildId, taskIds: [result.data.id] });
          } catch {
            // continue linking other builds
          }
        }
      }
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
              <input
                value={form.assigneeName}
                onChange={(e) => setField('assigneeName', e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder="이름 입력"
              />
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

        {/* Section: Test types + Progress */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <TaskTestTypeRepeater
            testTypes={form.testTypes}
            onChange={(tt) => setField('testTypes', tt)}
          />
          {/* Auto-calculated progress */}
          <div className="flex items-center gap-3 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <span className="text-sm font-medium">전체 진행율</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressTotal}%`,
                  backgroundColor: progressTotal >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
                }}
              />
            </div>
            <span className="text-sm font-bold" style={{ color: 'var(--color-primary)', minWidth: '40px', textAlign: 'right' }}>
              {progressTotal}%
            </span>
          </div>
        </div>

        {/* Build Link (optional) */}
        {!isEdit && (
          <div
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <h2 className="text-sm font-semibold mb-1">빌드 연결 (선택사항)</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>업데이트 타겟</label>
                <select
                  value={form.buildTarget}
                  onChange={(e) => setField('buildTarget', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  disabled={!form.projectId}
                >
                  <option value="">선택</option>
                  {updateTargets.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {!form.projectId && (
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>프로젝트를 먼저 선택하세요</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>빌드 선택</label>
                {!form.buildTarget ? (
                  <p className="text-xs py-2" style={{ color: 'var(--color-text-secondary)' }}>타겟을 먼저 선택하세요</p>
                ) : targetBuilds.length === 0 ? (
                  <p className="text-xs py-2" style={{ color: 'var(--color-text-secondary)' }}>해당 타겟에 빌드가 없습니다</p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto rounded-lg p-2" style={{ backgroundColor: 'var(--color-bg)' }}>
                    {targetBuilds.map((b) => (
                      <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.buildIds.includes(b.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setField('buildIds', [...form.buildIds, b.id]);
                            } else {
                              setField('buildIds', form.buildIds.filter((bid) => bid !== b.id));
                            }
                          }}
                        />
                        <span>{b.buildOrder}차 빌드</span>
                        {b.buildVersions && b.buildVersions.length > 0 && (
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            ({b.buildVersions.map((bv) =>
                              bv.buildType === 'APP' ? `${bv.platform} v${bv.version}` : `${bv.cdnType} v${bv.version}`
                            ).join(', ')})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
