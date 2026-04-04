import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterBar from '../common/FilterBar';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { useBuilds, useUpdateBuildStatus, type BuildFilter } from '../../hooks/useBuilds';
import { useProjects } from '../../hooks/useProjects';
import {
  BUILD_STATUS_MAP,
  type BuildStatus,
  type Build,
} from '../../types';
import { formatDate } from '../../lib/utils';

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

function VersionBadges({ build }: { build: Build }) {
  if (!build.buildVersions || build.buildVersions.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>-</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {build.buildVersions.map((bv) => {
        const label =
          bv.buildType === 'APP'
            ? `${bv.platform ?? ''} v${bv.version}`
            : `${bv.cdnType ?? 'CDN'} v${bv.version}`;
        const bgColor =
          bv.buildType === 'APP' ? 'var(--color-primary)' : 'var(--color-warning)';
        return (
          <span
            key={bv.id}
            className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium"
            style={{
              backgroundColor: `color-mix(in srgb, ${bgColor} 15%, transparent)`,
              color: bgColor,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function TaskLinkCount({ build }: { build: Build }) {
  const count = build._count?.taskLinks ?? build.taskLinks?.length ?? 0;
  if (count === 0) {
    return <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>-</span>;
  }
  return (
    <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
      {count}건
    </span>
  );
}

export default function BuildListPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BuildFilter>({});

  const { data: builds = [], isLoading } = useBuilds(filter);
  const { data: projects = [] } = useProjects();
  const updateStatus = useUpdateBuildStatus();

  const statusOptions = (Object.keys(BUILD_STATUS_MAP) as BuildStatus[]).map((k) => ({
    value: k,
    label: BUILD_STATUS_MAP[k].label,
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
        <h1 className="text-xl font-bold">빌드 관리</h1>
        <button
          onClick={() => navigate('/builds/new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Plus className="w-4 h-4" /> 빌드 등록
        </button>
      </div>

      {/* Filters */}
      <FilterBar
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
            onChange: (v) => setFilter((f) => ({ ...f, status: v || undefined })),
          },
        ]}
      />

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner size="lg" className="h-64" />
      ) : builds.length === 0 ? (
        <EmptyState
          title="빌드가 없습니다"
          description="새 빌드를 등록해 보세요."
          action={
            <button
              onClick={() => navigate('/builds/new')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              빌드 등록
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>프로젝트</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>차수</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>수급일</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>업데이트 타겟</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>포함 버전</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>상태</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>연결 일감</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}></th>
                </tr>
              </thead>
              <tbody>
                {builds.map((build) => (
                  <tr
                    key={build.id}
                    onClick={() => navigate(`/builds/${build.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td className="px-4 py-3">
                      {build.project ? (
                        <span className="flex items-center gap-1.5">
                          {build.project.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: build.project.color }}
                            />
                          )}
                          <span className="font-medium">{build.project.name}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{build.buildOrder}차</td>
                    <td className="px-4 py-3 tabular-nums">{formatDate(build.receivedDate)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatDate(build.updateTarget)}</td>
                    <td className="px-4 py-3">
                      <VersionBadges build={build} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <BuildStatusBadge status={build.status} />
                        {build.status === 'REJECTED' && build.rejectionReason && (
                          <span
                            className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
                              color: 'var(--color-danger)',
                            }}
                            title={`반려 사유: ${build.rejectionReason}`}
                          >
                            사유
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TaskLinkCount build={build} />
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {build.status === 'REJECTED' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: build.id, status: 'RECEIVED' })}
                          disabled={updateStatus.isPending}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
                            color: 'var(--color-info)',
                          }}
                          title="RECEIVED 상태로 재수정"
                        >
                          <RotateCcw className="w-3 h-3" />
                          재수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
