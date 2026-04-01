import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { useTeam } from '../../hooks/useTeam';
import { useTasks } from '../../hooks/useTasks';
import TeamMemberCard from './TeamMemberCard';
import TeamStatusBoard from './TeamStatusBoard';
import MemberWorkloadPanel from './MemberWorkloadPanel';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

export default function TeamPage() {
  const { data: members = [], isLoading: teamLoading } = useTeam();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();

  const isLoading = teamLoading || tasksLoading;
  const today = dayjs().format('YYYY-MM-DD');

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;

  if (members.length === 0) {
    return <EmptyState title="팀원 정보가 없습니다" />;
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-bold">팀원 현황</h1>

      {/* Status board + Workload */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <TeamStatusBoard members={members} />
        </div>
        <MemberWorkloadPanel members={members} tasks={tasks} />
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-4 gap-4">
        {members.map((m) => {
          const memberTasks = tasks.filter((t) => t.assigneeId === m.id && t.status !== 'DONE');
          const dueTodayCount = memberTasks.filter((t) => t.dueDate === today).length;

          return (
            <TeamMemberCard
              key={m.id}
              member={m}
              taskCount={memberTasks.length}
              dueTodayCount={dueTodayCount}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
