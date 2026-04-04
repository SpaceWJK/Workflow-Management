import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateMyStatus } from '../../hooks/useProfile';
import { TEAM_STATUS_MAP, type TeamStatus } from '../../types';
import StatusBadge from '../common/StatusBadge';

const STATUS_OPTIONS: Array<{ value: TeamStatus; icon: string }> = [
  { value: 'AWAY', icon: '🚶' },
  { value: 'IN_MEETING', icon: '📋' },
  { value: 'FIELD_WORK', icon: '🏢' },
  { value: 'BUSINESS_TRIP', icon: '✈️' },
  { value: 'REMOTE', icon: '🏠' },
];

export default function StatusPage() {
  const user = useAuthStore((s) => s.user);
  const updateStatus = useUpdateMyStatus();

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-bold">상태 업데이트</h1>

      {/* 현재 상태 */}
      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-sm font-semibold">현재 상태</h2>
        </div>
        <div className="flex items-center gap-3">
          {user && <StatusBadge status={user.teamStatus} />}
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {user && TEAM_STATUS_MAP[user.teamStatus]?.label}
          </span>
        </div>
      </section>

      {/* 상태 변경 */}
      <section
        className="rounded-xl p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold">상태 변경</h2>
        <div className="grid grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(({ value, icon }) => {
            const meta = TEAM_STATUS_MAP[value];
            const isActive = user?.teamStatus === value;
            return (
              <button
                key={value}
                onClick={() => updateStatus.mutate(isActive ? 'AVAILABLE' : value)}
                disabled={updateStatus.isPending}
                className="flex flex-col items-center gap-2 px-4 py-4 rounded-xl text-sm font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: isActive ? `color-mix(in srgb, ${meta.color} 20%, var(--color-surface))` : 'var(--color-bg)',
                  color: isActive ? meta.color : 'var(--color-text-secondary)',
                  border: `1.5px solid ${isActive ? meta.color : 'var(--color-border)'}`,
                }}
              >
                <span className="text-2xl">{icon}</span>
                <span>{meta.label}</span>
                {isActive && <CheckCircle2 className="w-4 h-4" />}
                {updateStatus.isPending && updateStatus.variables === value && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}
