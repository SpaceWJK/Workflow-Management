import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Filter, X, Check, User, Briefcase } from 'lucide-react';
import dayjs from 'dayjs';
import MonthCalendarGrid from './MonthCalendarGrid';
import GanttTimeline from './GanttTimeline';
import EventModal from './EventModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import type { CalendarEvent } from '../../types';

type ViewMode = 'month' | 'gantt';

export default function CalendarPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('month');
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showPersonal, setShowPersonal] = useState(true);
  const [showProject, setShowProject] = useState(true);
  const filterRef = useRef<HTMLDivElement>(null);

  // 필터 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  // 캘린더 이벤트: 현재 월 기준 범위 조회
  const startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).startOf('month').format('YYYY-MM-DD');
  const endDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');
  const { data: calendarEvents = [] } = useCalendarEvents(startDate, endDate);

  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [], isLoading: projLoading } = useProjects();

  // 프로젝트 필터 적용
  const filteredTasks = useMemo(() => {
    if (selectedProjectIds.length === 0) return tasks;
    return tasks.filter(t => selectedProjectIds.includes(t.projectId));
  }, [tasks, selectedProjectIds]);

  const toggleProject = (id: number) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const isLoading = tasksLoading || projLoading;

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setSelectedEvent(undefined);
    setEventModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(undefined);
    setEventModalOpen(true);
  };

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const [todayFlash, setTodayFlash] = useState(false);

  const goToday = () => {
    const now = dayjs();
    setYear(now.year());
    setMonth(now.month() + 1);
    // 오늘 셀 하이라이트 flash
    setTodayFlash(true);
    setTimeout(() => setTodayFlash(false), 1200);
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
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">캘린더</h1>

          {/* 개인/프로젝트 일정 토글 스위치 */}
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'var(--color-bg)' }}>
            <button
              onClick={() => setShowPersonal(!showPersonal)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: showPersonal ? 'var(--color-surface)' : 'transparent',
                color: showPersonal ? 'var(--color-warning)' : 'var(--color-text-secondary)',
                boxShadow: showPersonal ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                opacity: showPersonal ? 1 : 0.5,
              }}
              title="개인 일정 표시/숨기기"
            >
              <User className="w-3 h-3" />
              개인
            </button>
            <button
              onClick={() => setShowProject(!showProject)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: showProject ? 'var(--color-surface)' : 'transparent',
                color: showProject ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: showProject ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
                opacity: showProject ? 1 : 0.5,
              }}
              title="프로젝트 일정 표시/숨기기"
            >
              <Briefcase className="w-3 h-3" />
              프로젝트
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project filter */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: selectedProjectIds.length > 0 ? 'color-mix(in srgb, var(--color-primary) 15%, var(--color-surface))' : 'var(--color-surface)',
                color: selectedProjectIds.length > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                border: `1px solid ${selectedProjectIds.length > 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}
            >
              <Filter className="w-3 h-3" />
              프로젝트{selectedProjectIds.length > 0 && ` (${selectedProjectIds.length})`}
            </button>
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 min-w-48 rounded-lg shadow-lg py-1 overflow-auto max-h-64"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  {selectedProjectIds.length > 0 && (
                    <button
                      onClick={() => setSelectedProjectIds([])}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:brightness-90 transition-colors"
                      style={{ color: 'var(--color-danger)' }}
                    >
                      <X className="w-3 h-3" /> 필터 초기화
                    </button>
                  )}
                  {projects.filter(p => p.status?.toUpperCase() === 'ACTIVE' || p.status === 'active').map(p => {
                    const isSelected = selectedProjectIds.includes(p.id);
                    const pColor = p.color || 'var(--color-primary)';
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProject(p.id)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs transition-colors cursor-pointer"
                        style={{
                          color: 'var(--color-text)',
                          backgroundColor: isSelected
                            ? `color-mix(in srgb, ${pColor} 10%, transparent)`
                            : undefined,
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.backgroundColor = `color-mix(in srgb, ${pColor} 15%, var(--color-surface))`; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.backgroundColor = isSelected ? `color-mix(in srgb, ${pColor} 10%, transparent)` : ''; }}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: isSelected ? pColor : 'transparent',
                            border: `1.5px solid ${pColor}`,
                          }}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: pColor }}
                        />
                        <span className="font-medium">{p.name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View mode */}
          <div className="flex items-center gap-1">
            {([['month', '월간'], ['gantt', '간트']] as [ViewMode, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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
              <button onClick={prevMonth} className="p-1 rounded cursor-pointer hover:bg-[var(--color-surface-hover)]">
                <ChevronLeft className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <span className="text-sm font-medium w-28 text-center tabular-nums">
                {year}년 {month}월
              </span>
              <button onClick={nextMonth} className="p-1 rounded cursor-pointer hover:bg-[var(--color-surface-hover)]">
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
              <button
                onClick={goToday}
                className="px-2 py-1 rounded text-xs font-medium ml-1 cursor-pointer hover:brightness-90 transition-colors"
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
            tasks={showProject ? filteredTasks : []}
            calendarEvents={showPersonal ? calendarEvents : []}
            todayFlash={todayFlash}
            onTaskClick={(id) => navigate(`/tasks/${id}`)}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <GanttTimeline tasks={showProject ? filteredTasks : []} projects={projects} />
        )}
      </div>

      {/* Event modal */}
      <EventModal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        event={selectedEvent}
        defaultDate={selectedDate}
      />
    </motion.div>
  );
}
