import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import MonthCalendarGrid from './MonthCalendarGrid';
import GanttTimeline from './GanttTimeline';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';

type ViewMode = 'month' | 'gantt';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('month');
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [], isLoading: projLoading } = useProjects();

  const isLoading = tasksLoading || projLoading;

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const goToday = () => {
    setYear(dayjs().year());
    setMonth(dayjs().month() + 1);
  };

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">캘린더</h1>

        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex items-center gap-1">
            {([['month', '월간'], ['gantt', '간트']] as [ViewMode, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: mode === key ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: mode === key ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Month navigation */}
          {mode === 'month' && (
            <div className="flex items-center gap-2 ml-4">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-[var(--color-surface-hover)]">
                <ChevronLeft className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <span className="text-sm font-medium w-28 text-center tabular-nums">
                {year}년 {month}월
              </span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-[var(--color-surface-hover)]">
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={goToday}
                className="px-2 py-1 rounded text-xs font-medium ml-1"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
              >
                오늘
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {mode === 'month' ? (
          <MonthCalendarGrid
            year={year}
            month={month}
            tasks={tasks}
            onTaskClick={(id) => navigate(`/tasks/${id}`)}
          />
        ) : (
          <GanttTimeline tasks={tasks} projects={projects} />
        )}
      </div>
    </motion.div>
  );
}
