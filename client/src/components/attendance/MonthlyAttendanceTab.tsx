import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ArrowUpDown, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { useMonthlyAttendance } from '../../hooks/useAttendance';
import { useProjects } from '../../hooks/useProjects';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { type MonthlyMember } from '../../types';
import { formatDuration, getInitials } from '../../lib/utils';

type SortField = 'totalSeconds' | 'presentDays' | 'lateDays' | 'absentDays';
type SortDir = 'asc' | 'desc';

export default function MonthlyAttendanceTab() {
  const currentYear = dayjs().year();
  const currentMonth = dayjs().month() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [teamFilter, setTeamFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalSeconds');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: projects = [] } = useProjects();

  const filters = useMemo(() => ({
    team: teamFilter || undefined,
    projectId: projectFilter ? Number(projectFilter) : undefined,
  }), [teamFilter, projectFilter]);

  const { data, isLoading } = useMonthlyAttendance(year, month, filters);

  // 팀 목록: 응답 members에서 고유 team 값 추출
  const teamOptions = useMemo(() => {
    if (!data?.members) return [];
    const teams = new Set(
      data.members.map((m) => m.team).filter((t): t is string => t !== null)
    );
    return Array.from(teams).sort();
  }, [data?.members]);

  const sortedMembers = useMemo(() => {
    const members: MonthlyMember[] = data?.members ?? [];
    return [...members].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [data?.members, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />;
    return sortDir === 'desc'
      ? <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
      : <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />;
  }

  function SortableHeader({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-80"
        style={{ color: sortField === field ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
        aria-label={`${label} 기준 정렬`}
      >
        {label}
        <SortIcon field={field} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 필터 바 */}
      <div
        className="rounded-xl p-4 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="monthly-year" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            연도
          </label>
          <select
            id="monthly-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="monthly-month" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            월
          </label>
          <select
            id="monthly-month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="monthly-team" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            팀
          </label>
          <select
            id="monthly-team"
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
          <label htmlFor="monthly-project" className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            프로젝트
          </label>
          <select
            id="monthly-project"
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

        {data && (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            근무일 {data.workingDays}일
          </span>
        )}
      </div>

      {/* 테이블 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            <h2 className="text-sm font-semibold">
              {year}년 {month}월 월간 근무 현황
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
            >
              {sortedMembers.length}명
            </span>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner size="md" className="h-48" />
        ) : sortedMembers.length === 0 ? (
          <EmptyState title="데이터가 없습니다" description="해당 월의 근무 데이터가 없습니다." className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="월간 근무 현황 테이블">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' }}
                  >
                    이름
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <SortableHeader field="presentDays" label="출근일수" />
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <SortableHeader field="lateDays" label="지각일수" />
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <SortableHeader field="absentDays" label="결근일수" />
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left"
                    style={{ backgroundColor: 'var(--color-bg)' }}
                  >
                    <SortableHeader field="totalSeconds" label="총근무시간" />
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold"
                    style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg)' }}
                  >
                    일평균
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedMembers.map((member) => (
                  <tr
                    key={member.userId}
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
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={`${member.name} 프로필`}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                            aria-hidden="true"
                          >
                            {getInitials(member.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-text)' }}>{member.name}</p>
                          {member.team && (
                            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.team}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: 'var(--color-success)' }}>
                        {member.presentDays}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>일</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-medium"
                        style={{ color: member.lateDays > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}
                      >
                        {member.lateDays}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>일</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-medium"
                        style={{ color: member.absentDays > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}
                      >
                        {member.absentDays}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>일</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text)' }}>
                      {formatDuration(member.totalSeconds)}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDuration(member.avgSecondsPerDay)}
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
