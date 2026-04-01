import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ListTodo,
  Play,
  AlertTriangle,
  CalendarClock,
  UserX,
} from 'lucide-react';
import KPICard from '../common/KPICard';
import type { DashboardKPI } from '../../types';

interface DashboardKPICardsProps {
  kpi: DashboardKPI;
}

export default function DashboardKPICards({ kpi }: DashboardKPICardsProps) {
  const navigate = useNavigate();

  const cards = [
    {
      title: '총 프로젝트',
      value: kpi.totalProjects,
      icon: <FolderKanban className="w-4 h-4" />,
      color: 'var(--color-primary)',
      onClick: () => navigate('/projects'),
    },
    {
      title: '총 일감',
      value: kpi.totalTasks,
      icon: <ListTodo className="w-4 h-4" />,
      color: 'var(--color-info)',
      onClick: () => navigate('/tasks'),
    },
    {
      title: '진행중',
      value: kpi.inProgressTasks,
      icon: <Play className="w-4 h-4" />,
      color: 'var(--color-success)',
      onClick: () => navigate('/tasks?status=in_progress'),
    },
    {
      title: '지연',
      value: kpi.delayedTasks,
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'var(--color-danger)',
      onClick: () => navigate('/tasks?status=delayed'),
    },
    {
      title: '오늘 마감',
      value: kpi.dueTodayTasks,
      icon: <CalendarClock className="w-4 h-4" />,
      color: 'var(--color-warning)',
      onClick: () => navigate('/tasks'),
    },
    {
      title: '부재 인원',
      value: kpi.absentMembers,
      icon: <UserX className="w-4 h-4" />,
      color: 'var(--color-text-secondary)',
      onClick: () => navigate('/team'),
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-4">
      {cards.map((card) => (
        <KPICard key={card.title} {...card} />
      ))}
    </div>
  );
}
