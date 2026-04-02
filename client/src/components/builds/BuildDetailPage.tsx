import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useBuild, useDeleteBuild, useUpdateBuildStatus } from '../../hooks/useBuilds';
import { BUILD_STATUS_MAP, TASK_STATUS_MAP, type BuildStatus } from '../../types';
import { formatDate } from '../../lib/utils';
import dayjs from 'dayjs';

/** Valid status transitions for each build status */
const STATUS_TRANSITIONS: Record<BuildStatus, BuildStatus[]> = {
  RECEIVED: ['TESTING'],
  TESTING: ['TEST_DONE', 'REJECTED'],
  TEST_DONE: ['APPROVED', 'REJECTED'],
  APPROVED: ['RELEASED'],
  REJECTED: [],
  RELEASED: [],
};

function BuildStatusBadge({ status }: { status: BuildStatus }) {
  const meta = BUILD_STATUS_MAP[status];
  if (!meta) return <span>{status}</span>;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${meta.color} 20%, transparent)`,
        color: meta.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}

function DDay({ targetDate }: { targetDate: string }) {
  const diff = dayjs(targetDate).diff(dayjs().startOf('day'), 'day');
  let label: string;
  let color: string;

  if (diff < 0) {
    label = `D+${Math.abs(diff)}`;
    color = 'var(--color-danger)';
  } else if (diff === 0) {
    label = 'D-Day';
    color = 'var(--color-warning)';
  } else {
    label = `D-${diff}`;
    color = diff <= 3 ? 'var(--color-warning)' : 'var(--color-success)';
  }

  return (
    <span
      className="inline-flex px-2 py-0.5 rounded text-xs font-bold"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

export default function BuildDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: build, isLoading } = useBuild(id ? Number(id) : undefined);
  const deleteBuild = useDeleteBuild();
  const updateStatus = useUpdateBuildStatus();
  const [showDelete, setShowDelete] = useState(false);

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;
  if (!build) return <EmptyState title="빌드를 찾을 수 없습니다" />;

  const handleDelete = async () => {
    await deleteBuild.mutateAsync(build.id);
    navigate('/builds');
  };

  const handleStatusChange = async (newStatus: BuildStatus) => {
    await updateStatus.mutateAsync({ id: build.id, status: newStatus });
  };

  const validTransitions = STATUS_TRANSITIONS[build.status] || [];

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
            onClick={() => navigate('/builds')}
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
          <h1 className="text-xl font-bold">
            {build.project ? (
              <span className="flex items-center gap-2">
                {build.project.color && (
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: build.project.color }} />
                )}
                {build.project.name}
              </span>
            ) : (
              '프로젝트'
            )}
            <span className="ml-2 text-lg font-normal" style={{ color: 'var(--color-text-secondary)' }}>
              {build.buildOrder}차 빌드
            </span>
          </h1>
          <BuildStatusBadge status={build.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/builds/${build.id}/edit`)}
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
            <span>{build.project?.name || '-'}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>차수</span>
            <span className="tabular-nums">{build.buildOrder}차</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>수급일</span>
            <span className="tabular-nums">{formatDate(build.receivedDate)}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>업데이트 타겟</span>
            <span className="flex items-center gap-2 tabular-nums">
              {formatDate(build.updateTarget)}
              <DDay targetDate={build.updateTarget} />
            </span>
          </div>
          {build.memo && (
            <div className="mt-2">
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>메모</span>
              <p className="text-sm mt-1">{build.memo}</p>
            </div>
          )}
        </div>

        {/* Status transitions */}
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">상태 변경</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>현재:</span>
            <BuildStatusBadge status={build.status} />
          </div>
          {validTransitions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {validTransitions.map((nextStatus) => {
                const meta = BUILD_STATUS_MAP[nextStatus];
                return (
                  <button
                    key={nextStatus}
                    onClick={() => handleStatusChange(nextStatus)}
                    disabled={updateStatus.isPending}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${meta.color} 20%, transparent)`,
                      color: meta.color,
                      border: `1px solid ${meta.color}`,
                    }}
                  >
                    {meta.label}(으)로 전환
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              최종 상태입니다.
            </p>
          )}
        </div>
      </div>

      {/* Build versions */}
      {build.buildVersions && build.buildVersions.length > 0 && (
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">빌드 버전</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>유형</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>플랫폼 / CDN</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>버전</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                {build.buildVersions.map((bv) => (
                  <tr key={bv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-3 py-2">
                      <span
                        className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: bv.buildType === 'APP'
                            ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)'
                            : 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                          color: bv.buildType === 'APP' ? 'var(--color-primary)' : 'var(--color-warning)',
                        }}
                      >
                        {bv.buildType}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {bv.buildType === 'APP' ? bv.platform || '-' : bv.cdnType || '-'}
                    </td>
                    <td className="px-3 py-2 tabular-nums font-medium">v{bv.version}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {bv.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Linked tasks */}
      {build.taskLinks && build.taskLinks.length > 0 && (
        <div
          className="rounded-xl p-5 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-semibold">연결된 일감</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>제목</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>상태</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>담당자</th>
                </tr>
              </thead>
              <tbody>
                {build.taskLinks.map((link) => {
                  const task = link.task;
                  if (!task) return null;
                  const statusMeta = TASK_STATUS_MAP[task.status];
                  return (
                    <tr
                      key={link.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                      style={{ borderBottom: '1px solid var(--color-border)' }}
                    >
                      <td className="px-3 py-2 font-medium">{task.title}</td>
                      <td className="px-3 py-2">
                        {statusMeta ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${statusMeta.color} 20%, transparent)`,
                              color: statusMeta.color,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusMeta.color }} />
                            {statusMeta.label}
                          </span>
                        ) : (
                          task.status
                        )}
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {task.assigneeName || '미지정'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDelete}
        title="빌드 삭제"
        message={`${build.project?.name || ''} ${build.buildOrder}차 빌드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </motion.div>
  );
}
