import { motion } from 'framer-motion';
import { Settings, Bell, Palette, Database, Info } from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    {
      icon: <Bell className="w-5 h-5" />,
      title: '알림 설정',
      description: '알림 수신 방법과 조건을 설정합니다.',
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: '테마 설정',
      description: '대시보드 테마와 색상을 커스터마이즈합니다.',
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: '데이터 관리',
      description: '데이터 백업 및 내보내기를 관리합니다.',
    },
    {
      icon: <Info className="w-5 h-5" />,
      title: '시스템 정보',
      description: 'QA Workflow 대시보드 버전 정보입니다.',
    },
  ];

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        <h1 className="text-xl font-bold">설정</h1>
      </div>

      <div className="flex flex-col gap-3">
        {sections.map((s) => (
          <div
            key={s.title}
            className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {s.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Version info */}
      <div className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
        QA Workflow Dashboard v0.1.0
      </div>
    </motion.div>
  );
}
