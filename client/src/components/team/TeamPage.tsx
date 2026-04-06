import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { Building2 } from 'lucide-react';
import { useTeam } from '../../hooks/useTeam';
import { useTasks } from '../../hooks/useTasks';
import TeamMemberCard from './TeamMemberCard';
import TeamStatusBoard from './TeamStatusBoard';
import MemberWorkloadPanel from './MemberWorkloadPanel';
import MemberProfileModal from './MemberProfileModal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import { TEAM_STATUS_MAP, type TeamStatus, type User } from '../../types';

export default function TeamPage() {
  const navigate = useNavigate();
  const { data: members = [], isLoading: teamLoading } = useTeam();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teamFilter, setTeamFilter] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const statusFilter = searchParams.get('status') as TeamStatus | null;

  const clearStatusFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('status');
    setSearchParams(params);
  };

  const isLoading = teamLoading || tasksLoading;
  const today = dayjs().format('YYYY-MM-DD');

  const teamOptions = useMemo(() => {
    const teams = new Set(members.map((m) => m.team).filter(Boolean) as string[]);
    return Array.from(teams).sort();
  }, [members]);

  const filteredMembers = useMemo(() => {
    let result = members;
    if (teamFilter) result = result.filter((m) => m.team === teamFilter);
    if (statusFilter === 'ABSENT' as string) {
      // 부재 인원: 휴가, 자리비움, 퇴근
      result = result.filter((m) => ['ON_LEAVE', 'AWAY', 'OFF_WORK'].includes(m.teamStatus));
    } else if (statusFilter) {
      result = result.filter((m) => m.teamStatus === statusFilter);
    }
    return result;
  }, [members, teamFilter, statusFilter]);

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;

  if (members.length === 0) {
    return <EmptyState title="팀원 정보가 없습니다" />;
  }

  const statusMeta = statusFilter === 'ABSENT' as string
    ? { label: '부재', color: 'var(--color-text-secondary)' }
    : statusFilter ? TEAM_STATUS_MAP[statusFilter] : null;

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">팀원 현황</h1>
          {statusFilter && statusMeta && (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, ${statusMeta.color} 20%, var(--color-surface))`,
                  color: statusMeta.color,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusMeta.color }} />
                {statusMeta.label} ({filteredMembers.length}명)
              </span>
              <button
                onClick={clearStatusFilter}
                className="text-xs cursor-pointer hover:opacity-80"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                ✕ 초기화
              </button>
            </div>
          )}
        </div>
        {teamOptions.length > 0 && (
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            aria-label="팀 필터"
            className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            <option value="">전체 팀</option>
            {teamOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      {/* Pixel Office 진입 버튼 */}
      <button
        onClick={() => navigate('/team/pixel-office')}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all hover:opacity-90 self-start"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))',
          border: '1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border))',
          color: 'var(--color-primary)',
        }}
      >
        <Building2 className="w-4 h-4" />
        Pixel Office
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)',
            color: 'var(--color-success)',
          }}
        >
          {members.filter((m) => ['AVAILABLE', 'IN_MEETING', 'HALF_DAY', 'REMOTE'].includes(m.teamStatus)).length}명 근무중
        </span>
      </button>

      {/* Status board + Workload */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <TeamStatusBoard members={members} />
        </div>
        <MemberWorkloadPanel members={members} tasks={tasks} />
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-4 gap-4">
        {filteredMembers.map((m) => {
          const memberTasks = tasks.filter((t) => t.assigneeId === m.id && t.status !== 'DONE');
          const dueTodayCount = memberTasks.filter((t) => t.dueDate === today).length;

          return (
            <TeamMemberCard
              key={m.id}
              member={m}
              taskCount={memberTasks.length}
              dueTodayCount={dueTodayCount}
              onProfileClick={() => setSelectedMember(m)}
            />
          );
        })}
      </div>

      {/* 프로필 모달 */}
      <MemberProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </motion.div>
  );
}
