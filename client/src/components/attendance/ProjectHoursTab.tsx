import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ChevronDown, ChevronRight, Users, FolderKanban } from 'lucide-react';
import { useProjectHours } from '../../hooks/useAttendance';
import { useProjects } from '../../hooks/useProjects';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { formatDuration } from '../../lib/utils';

interface ProjectEntry {
  projectId: number;
  projectName: string;
  projectColor: string;
  totalSeconds: number;
  memberCount: number;
  avgSecondsPerMember: number;
  members: Array<{ userId: number; name: string; totalSeconds: number }>;
  tasks: Array<{ taskId: number; title: string; totalSeconds: number; assigneeName: string | null }>;
}

function ProjectCard({
  project,
  isExpanded,
  onToggle,
}: {
  project: ProjectEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const accentColor = project.projectColor || 'var(--color-primary)';

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* 프로젝트 헤더 — 클릭으로 확장/축소 */}
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 text-left transition-colors cursor-pointer"
        style={{ backgroundColor: 'transparent' }}
        aria-expanded={isExpanded}
        aria-controls={`project-detail-${project.projectId}`}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--color-surface-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        {/* 색상 표시 */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor }}
          aria-hidden="true"
        />

        {/* 프로젝트명 */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
            {project.projectName}
          </p>
        </div>

        {/* 요약 수치 */}
        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold" style={{ color: accentColor }}>
              {formatDuration(project.totalSeconds)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>총 소요시간</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              {project.memberCount}명
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>투입인원</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
              {formatDuration(project.avgSecondsPerMember)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>인당평균</p>
          </div>
          {isExpanded
            ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
            : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
          }
        </div>
      </button>

      {/* 확장 상세 영역 */}
      {isExpanded && (
        <div
          id={`project-detail-${project.projectId}`}
          className="border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="grid grid-cols-2 gap-0 divide-x" style={{ borderColor: 'var(--color-border)' }}>
            {/* 일감별 상세 */}
            <div className="p-4">
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                일감별 소요시간
              </h3>
              {project.tasks.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>기록된 일감이 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {project.tasks.map((task) => (
                    <div key={task.taskId} className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: 'var(--color-text)' }}>
                          {task.title}
                        </p>
                        {task.assigneeName && (
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {task.assigneeName}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-sm font-medium flex-shrink-0"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {formatDuration(task.totalSeconds)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 담당자별 분포 */}
            <div className="p-4">
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                담당자별 분포
              </h3>
              {project.members.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>담당자 데이터가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {project.members.map((member) => {
                    const ratio = project.totalSeconds > 0
                      ? (member.totalSeconds / project.totalSeconds) * 100
                      : 0;
                    return (
                      <div key={member.userId} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                            {member.name}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            {formatDuration(member.totalSeconds)}
                          </span>
                        </div>
                        {/* 비율 바 */}
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'var(--color-border)' }}
                          role="progressbar"
                          aria-valuenow={Math.round(ratio)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${member.name} 기여도 ${Math.round(ratio)}%`}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${ratio}%`,
                              backgroundColor: accentColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectHoursTab() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);
  const [projectFilter, setProjectFilter] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const { data: projects = [] } = useProjects();

  const { data, isLoading } = useProjectHours(
    startDate,
    endDate,
    projectFilter ? Number(projectFilter) : undefined,
  );

  const displayedProjects = useMemo(() => {
    return data?.projects ?? [];
  }, [data?.projects]);

  const toggleExpand = (projectId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(displayedProjects.map((p) => p.projectId)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const totalSeconds = useMemo(
    () => displayedProjects.reduce((acc, p) => acc + p.totalSeconds, 0),
    [displayedProjects],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 필터 바 */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="project-start" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            시작일
          </label>
          <input
            id="project-start"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="project-end" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            종료일
          </label>
          <input
            id="project-end"
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="project-filter" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            프로젝트
          </label>
          <select
            id="project-filter"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">전체 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 요약 + 전체 펼치기/닫기 */}
      {!isLoading && displayedProjects.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                {displayedProjects.length}개 프로젝트
              </span>
            </div>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>•</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                총 {formatDuration(totalSeconds)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              전체 펼치기
            </button>
            <button
              onClick={collapseAll}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
            >
              전체 닫기
            </button>
          </div>
        </div>
      )}

      {/* 프로젝트 카드 목록 */}
      {isLoading ? (
        <LoadingSpinner size="md" className="h-48" />
      ) : displayedProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-12 h-12" />}
          title="데이터가 없습니다"
          description="선택한 기간에 프로젝트별 소요시간 데이터가 없습니다."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              isExpanded={expandedIds.has(project.projectId)}
              onToggle={() => toggleExpand(project.projectId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
