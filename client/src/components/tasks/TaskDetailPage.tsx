import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Clock } from 'lucide-react';
import { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import RiskBadge from '../common/RiskBadge';
import ProgressBar from '../common/ProgressBar';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import TimerButton from '../common/TimerButton';
import { useTask, useDeleteTask } from '../../hooks/useTasks';
import { useTimerStatus } from '../../hooks/useTimer';
import { formatDate, formatPercent, remainingDays, calcRequiredVelocity, getVelocityColor } from '../../lib/utils';

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id ? Number(id) : undefined);
  const deleteTask = useDeleteTask();
  const { data: timerStatus } = useTimerStatus(id ? Number(id) : undefined);
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;
  if (!task) return <EmptyState title="일감을 찾을 수 없습니다" />;

  const days = remainingDays(task.dueDate);
  const gap = task.progressTotal - task.expectedProgress;
  const velocity = calcRequiredVelocity(task.progressTotal, task.dueDate);
  const velColor = getVelocityColor(velocity);

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    navigate('/tasks');
  };

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-4xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <h1 className="text-xl font-bold">{task.title}</h1>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Edit className="w-4 h-4" /> 수정
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-danger)' }}
          >
            <Trash2 className="w-4 h-4" /> 삭제
          </button>
        </div>
      </div>

      {/* Timer widget */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <span className="text-sm font-semibold">작업 시간</span>
          {timerStatus && (
            <span className="text-sm tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              누적 {formatSeconds(timerStatus.totalSeconds)}
            </span>
          )}
        </div>
        <TimerButton taskId={task.id} />
      </div>

      {/* Timer logs */}
      {timerStatus?.logs && timerStatus.logs.length > 0 && (
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">타이머 기록</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>시작</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>종료</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>소요</th>
                </tr>
              </thead>
              <tbody>
                {timerStatus.logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-3 py-2 tabular-nums">{formatDate(log.startedAt, 'MM-DD HH:mm:ss')}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {log.stoppedAt ? formatDate(log.stoppedAt, 'MM-DD HH:mm:ss') : (
                        <span style={{ color: 'var(--color-success)' }}>진행 중</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {log.duration != null ? formatSeconds(log.duration) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Basic info */}
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">기본 정보</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span style={{ color: 'var(--color-text-secondary)' }}>프로젝트</span>
            <span>{task.project?.name || '-'}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>담당자</span>
            <span>{task.assignee?.name || '미지정'}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>시작일</span>
            <span className="tabular-nums">{formatDate(task.startDate)}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>마감일</span>
            <span className="tabular-nums">{formatDate(task.dueDate)}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>남은 일수</span>
            <span
              className="font-medium tabular-nums"
              style={{ color: days < 0 ? 'var(--color-danger)' : days <= 3 ? 'var(--color-warning)' : 'var(--color-text)' }}
            >
              {days < 0 ? `${Math.abs(days)}일 초과` : days === 0 ? '오늘 마감' : `${days}일`}
            </span>
            <span
              style={{ color: 'var(--color-text-secondary)', cursor: 'help' }}
              title="마감일까지 남은 기간, 현재 진행율, 상태를 종합하여 자동 산출됩니다. (LOW → MEDIUM → HIGH → CRITICAL)"
            >위험도 ⓘ</span>
            <span><RiskBadge level={task.riskLevel} /></span>
          </div>
          {task.description && (
            <div className="mt-2">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>설명</span>
              <p className="text-sm mt-1">{task.description}</p>
            </div>
          )}
        </div>

        {/* Schedule analysis */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">일정 대비 분석</h3>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--color-text-secondary)' }}>실제 진행률</span>
              <span className="font-bold tabular-nums">{formatPercent(task.progressTotal)}</span>
            </div>
            <ProgressBar value={task.progressTotal} height="h-2.5" color="var(--color-primary)" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span
                style={{ color: 'var(--color-text-secondary)', cursor: 'help' }}
                title="시작일~마감일 기간 중 오늘까지의 경과 비율입니다. 실제 진행률과 비교하여 일정 지연 여부를 판단합니다."
              >기대 진행률 ⓘ</span>
              <span className="tabular-nums">{formatPercent(task.expectedProgress)}</span>
            </div>
            <ProgressBar value={task.expectedProgress} height="h-2.5" color="var(--color-text-secondary)" />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} title="실제 진행률 - 기대 진행률. 양수면 앞서가는 중, 음수면 지연 중입니다.">진행 갭 ⓘ</div>
              <div
                className="text-lg font-bold tabular-nums"
                style={{ color: gap < 0 ? 'var(--color-danger)' : 'var(--color-success)' }}
              >
                {gap > 0 ? '+' : ''}{formatPercent(gap)}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} title="남은 기간 내 100% 달성을 위해 하루에 필요한 진행률입니다.">필요 속도 ⓘ</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: velColor }}>
                {velocity > 100 ? '100+' : velocity}%/일
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test types */}
      {task.testTypes && task.testTypes.length > 0 && (
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">테스트 종류별 진행</h3>
          <div className="flex flex-col gap-3">
            {task.testTypes.map((tt) => (
              <div key={tt.id} className="flex items-center gap-3">
                <span className="text-sm w-28 shrink-0">{tt.testTypeCode}</span>
                <ProgressBar value={tt.progress} height="h-2" showLabel className="flex-1" />
                {tt.note && (
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {tt.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memo */}
      {task.memo && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold mb-2">메모</h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{task.memo}</p>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDelete}
        title="일감 삭제"
        message={`"${task.title}" 일감을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </motion.div>
  );
}
