import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, BarChart3, User, FolderKanban } from 'lucide-react';
import DailyAttendanceTab from './DailyAttendanceTab';
import MonthlyAttendanceTab from './MonthlyAttendanceTab';
import PersonalAttendanceTab from './PersonalAttendanceTab';
import ProjectHoursTab from './ProjectHoursTab';

type TabId = 'daily' | 'monthly' | 'personal' | 'project';

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  { id: 'daily', label: '일간 현황', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'monthly', label: '월간 근무시간', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'personal', label: '개인별 상세', icon: <User className="w-4 h-4" /> },
  { id: 'project', label: '프로젝트별 소요시간', icon: <FolderKanban className="w-4 h-4" /> },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('daily');

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">근태 관리</h1>
      </div>

      {/* Tab navigation */}
      <div
        className="flex items-center gap-1 p-1 rounded-lg w-fit"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        role="tablist"
        aria-label="근태 관리 탭"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer"
              style={{
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-label={TABS.find((t) => t.id === activeTab)?.label}
      >
        {activeTab === 'daily' && <DailyAttendanceTab />}
        {activeTab === 'monthly' && <MonthlyAttendanceTab />}
        {activeTab === 'personal' && <PersonalAttendanceTab />}
        {activeTab === 'project' && <ProjectHoursTab />}
      </div>
    </motion.div>
  );
}
