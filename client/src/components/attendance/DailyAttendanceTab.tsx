import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Users, UserCheck, UserX, Clock, Home } from 'lucide-react';
import { useDailyAttendance } from '../../hooks/useAttendance';
import { useProjects } from '../../hooks/useProjects';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { ATTENDANCE_STATUS_MAP, type AttendanceRecord, type AttendanceStatus } from '../../types';
import { formatTimeKST, formatDuration, getInitials } from '../../lib/utils';

function AttendanceBadge({ status }: { status: AttendanceStatus | 'ABSENT' }) {
  const meta = ATTENDANCE_STATUS_MAP[status as AttendanceStatus];
  if (!meta) return <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{status}</span>;

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

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  iconColor: string;
}

function SummaryCard({ icon, label, value, iconColor }: SummaryCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex items-center gap-4"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${iconColor} 15%, transparent)`, color: iconColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      </div>
    </div>
  );
}

export default function DailyAttendanceTab() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [teamFilter, setTeamFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const { data: projects = [] } = useProjects();

  const filters = useMemo(() => ({
    team: teamFilter || undefined,
    projectId: projectFilter ? Number(projectFilter) : undefined,
  }), [teamFilter, projectFilter]);

  const { data, isLoading } = useDailyAttendance(selectedDate, filters);

  // 팀 목록: 응답 records에서 고유 team 값 추출
  const teamOptions = useMemo(() => {
    if (!data?.records) return [];
    const teams = new Set(
      data.records.map((r) => r.team).filter((t): t is string => t !== null)
    );
    return Array.from(teams).sort();
  }, [data?.records]);

  const filteredRecords: AttendanceRecord[] = data?.records ?? [];

  // summary 카드 계산 (M-5 반영: 출근 = PRESENT+LATE+REMOTE+BUSINESS_TRIP)
  const presentCount = filteredRecords.filter((r) =>
    ['PRESENT', 'LATE', 'REMOTE', 'BUSINESS_TRIP'].includes(r.status)
  ).length;
  const absentCount = data?.summary.absent ?? 0;
  const lateCount = filteredRecords.filter((r) => r.status === 'LATE').length;
  const remoteCount = filteredRecords.filter((r) => r.status === 'REMOTE').length;

  return (
    <div className="flex flex-col gap-6">
      {/* 필터 바 */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="daily-date" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            날짜
          </label>
          <input
            id="daily-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="daily-team" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            팀
          </label>
          <select
            id="daily-team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">전체 팀</option>
            {teamOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="daily-project" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            프로젝트
          </label>
          <select
            id="daily-project"
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

      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard
          icon={<UserCheck className="w-5 h-5" />}
          label="출근"
          value={presentCount}
          iconColor="var(--color-success)"
        />
        <SummaryCard
          icon={<UserX className="w-5 h-5" />}
          label="미출근"
          value={absentCount}
          iconColor="var(--color-danger)"
        />
        <SummaryCard
          icon={<Clock className="w-5 h-5" />}
          label="지각"
          value={lateCount}
          iconColor="var(--color-warning)"
        />
        <SummaryCard
          icon={<Home className="w-5 h-5" />}
          label="재택"
          value={remoteCount}
          iconColor="var(--color-primary)"
        />
      </div>

      {/* 테이블 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-sm font-semibold">
              {selectedDate} 출근 현황
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
            >
              {filteredRecords.length}명
            </span>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner size="md" className="h-48" />
        ) : filteredRecords.length === 0 ? (
          <EmptyState title="출근 기록이 없습니다" description="해당 날짜에 출근 데이터가 없습니다." className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="일간 출근 현황 테이블">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['이름', '소속팀', '출근시간', '퇴근시간', '근무시간', '상태'].map((col) => (
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
                {filteredRecords.map((record) => (
                  <tr
                    key={record.userId}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'var(--color-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* 이름 + 아바타 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {record.avatarUrl ? (
                          <img
                            src={record.avatarUrl}
                            alt={`${record.name} 프로필`}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                            aria-hidden="true"
                          >
                            {getInitials(record.name)}
                          </div>
                        )}
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {record.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {record.team ?? '-'}
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
    </div>
  );
}
