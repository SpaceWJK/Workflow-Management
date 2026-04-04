import { motion } from 'framer-motion';
import DashboardKPICards from './DashboardKPICards';
import ProjectHealthList from './ProjectHealthList';
import TeamStatusSummary from './TeamStatusSummary';
import TodayScheduleWidget from './TodayScheduleWidget';
import RiskTaskTable from './RiskTaskTable';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useTeam } from '../../hooks/useTeam';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import type { DashboardKPI } from '../../types';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: members = [], isLoading: teamLoading } = useTeam();

  const today = dayjs().format('YYYY-MM-DD');
  const { data: calendarEvents = [] } = useCalendarEvents(today, today);

  const isLoading = tasksLoading || projectsLoading || teamLoading;

  // 완료/취소 제외한 활성 일감
  const activeTasks = tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELED');

  const kpi: DashboardKPI = {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    inProgressTasks: activeTasks.filter((t) => t.status === 'IN_PROGRESS').length,
    delayedTasks: activeTasks.filter((t) => {
      const due = t.dueDate?.slice(0, 10);
      return due && due < today;
    }).length,
    dueTodayTasks: activeTasks.filter((t) => t.dueDate?.slice(0, 10) === today).length,
    absentMembers: members.filter(
      (m) => m.teamStatus === 'ON_LEAVE' || m.teamStatus === 'AWAY' || m.teamStatus === 'OFF_WORK'
    ).length,
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="h-96" />;
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page title */}
      <h1 className="text-xl font-bold">대시보드</h1>

      {/* KPI cards */}
      <DashboardKPICards kpi={kpi} />

      {/* 2-column layout: health + team/schedule */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 flex flex-col gap-4">
          <ProjectHealthList projects={projects} />
          <RiskTaskTable tasks={tasks} />
        </div>
        <div className="flex flex-col gap-4">
          <TeamStatusSummary members={members} />
          <TodayScheduleWidget tasks={tasks} calendarEvents={calendarEvents} />
        </div>
      </div>
    </motion.div>
  );
}
