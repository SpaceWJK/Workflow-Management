import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { User, Clock, FolderOpen } from 'lucide-react';
import { usePersonalAttendance } from '../../hooks/useAttendance';
import { useTeam } from '../../hooks/useTeam';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { ATTENDANCE_STATUS_MAP, type AttendanceStatus } from '../../types';
import { formatTimeKST, formatDuration } from '../../lib/utils';

function AttendanceBadge({ status }: { status: string }) {
  const meta = ATTENDANCE_STATUS_MAP[status as AttendanceStatus];
  if (!meta) {
    return (
      <span className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>
        {status}
      </span>
    );
  }
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

export default function PersonalAttendanceTab() {
  const today = dayjs().format('YYYY-MM-DD');
  const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState(monthAgo);
  const [endDate, setEndDate] = useState(today);

  const { data: members = [], isLoading: membersLoading } = useTeam();

  const { data, isLoading: dataLoading } = usePersonalAttendance(
    selectedUserId,
    startDate,
    endDate,
  );

  const isLoading = membersLoading || dataLoading;

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedUserId),
    [members, selectedUserId],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 필터 바 */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="personal-user" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            팀원
          </label>
          <select
            id="personal-user"
            value={selectedUserId ?? ''}
            onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              minWidth: '140px',
            }}
          >
            <option value="">팀원 선택</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.team ? ` (${m.team})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="personal-start" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            시작일
          </label>
          <input
            id="personal-start"
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
          <label htmlFor="personal-end" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            종료일
          </label>
          <input
            id="personal-end"
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
      </div>

      {/* 팀원 미선택 안내 */}
      {!selectedUserId && (
        <EmptyState
          icon={<User className="w-12 h-12" />}
          title="팀원을 선택하세요"
          description="상단 드롭다운에서 팀원을 선택하면 출퇴근 이력이 표시됩니다."
        />
      )}

      {/* 데이터 로딩 */}
      {selectedUserId && isLoading && <LoadingSpinner size="md" className="h-48" />}

      {/* 데이터 표시 */}
      {selectedUserId && !isLoading && data && (
        <>
          {/* 출퇴근 이력 테이블 */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                <h2 className="text-sm font-semibold">
                  {selectedMember?.name ?? data.user.name} 출퇴근 이력
                </h2>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                >
                  {data.attendance.length}건
                </span>
              </div>
            </div>

            {data.attendance.length === 0 ? (
              <EmptyState title="출퇴근 이력이 없습니다" description="선택한 기간에 근태 데이터가 없습니다." className="py-12" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="개인 출퇴근 이력 테이블">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['날짜', '출근', '퇴근', '근무시간', '상태'].map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-semibold"
                          style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance.map((record) => (
                      <tr
                        key={record.date}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--color-border)' }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-surface-hover)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-text)' }}>
                          {record.date}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                          {formatTimeKST(record.clockIn)}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                          {formatTimeKST(record.clockOut)}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                          {formatDuration(record.duration)}
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 일감별 소요시간 섹션 */}
          {data.taskHours.length > 0 && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                  <h2 className="text-sm font-semibold">프로젝트별 소요시간</h2>
                </div>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {data.taskHours.map((project) => (
                  <div key={project.projectId} className="p-4">
                    {/* 프로젝트 헤더 */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.projectColor || 'var(--color-primary)' }}
                          aria-hidden="true"
                        />
                        <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          {project.projectName}
                        </span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                        {formatDuration(project.totalSeconds)}
                      </span>
                    </div>

                    {/* 일감 목록 */}
                    {project.tasks.length > 0 && (
                      <div className="ml-5 flex flex-col gap-1.5">
                        {project.tasks.map((task) => (
                          <div key={task.taskId} className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {task.title}
                            </span>
                            <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                              {formatDuration(task.totalSeconds)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 일감 데이터 없을 때 */}
          {data.taskHours.length === 0 && (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                해당 기간에 기록된 일감별 소요시간이 없습니다.
              </p>
            </div>
          )}
        </>
      )}

      {/* 선택했지만 데이터 없음 */}
      {selectedUserId && !isLoading && !data && (
        <EmptyState title="데이터를 불러올 수 없습니다" description="조회 조건을 확인해 주세요." />
      )}
    </div>
  );
}
