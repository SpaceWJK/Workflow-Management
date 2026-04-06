import { motion } from 'framer-motion';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAttendanceClock, useMyTodayAttendance } from '../../hooks/useAttendance';
import { TEAM_STATUS_MAP } from '../../types';
import { formatTimeKST, formatDuration } from '../../lib/utils';
import StatusBadge from '../common/StatusBadge';

export default function ClockPage() {
  const user = useAuthStore((s) => s.user);
  const clockInOut = useAttendanceClock();
  const { data: today } = useMyTodayAttendance();
  const statusMeta = user ? TEAM_STATUS_MAP[user.teamStatus] : null;

  // 출근 상태 판단: AttendanceLog 기반 (teamStatus가 아닌 실제 기록)
  const isClockedIn = today?.hasClockedIn && !today?.hasClockedOut;
  const isClockedOut = today?.hasClockedIn && today?.hasClockedOut;

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-xl font-bold">출/퇴근 체크</h1>

      <section
        className="rounded-xl p-8 flex flex-col items-center gap-6"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {/* 현재 상태 표시 */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl"
            style={{
              backgroundColor: `color-mix(in srgb, ${statusMeta?.color || 'var(--color-text-secondary)'} 15%, var(--color-surface))`,
              border: `3px solid ${statusMeta?.color || 'var(--color-text-secondary)'}`,
            }}
          >
            {isClockedIn ? '👨‍💻' : isClockedOut ? '🏠' : '🌙'}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {user && <StatusBadge status={user.teamStatus} />}
            <span className="text-sm font-medium">{statusMeta?.label}</span>
          </div>
        </div>

        {/* 오늘 출퇴근 정보 */}
        {today?.hasClockedIn && (
          <div className="flex items-center gap-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs">출근</span>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{formatTimeKST(today.clockIn)}</span>
            </div>
            {today.clockOut && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs">퇴근</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>{formatTimeKST(today.clockOut)}</span>
              </div>
            )}
            {today.duration != null && (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs">근무시간</span>
                <span className="font-medium" style={{ color: 'var(--color-primary)' }}>{formatDuration(today.duration)}</span>
              </div>
            )}
          </div>
        )}

        {/* 출퇴근 버튼 */}
        {isClockedIn ? (
          <button
            onClick={() => clockInOut.mutate('OUT')}
            disabled={clockInOut.isPending}
            className="flex items-center gap-3 px-10 py-4 rounded-xl text-base font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, var(--color-surface))',
              color: 'var(--color-danger)',
              border: '2px solid var(--color-danger)',
            }}
          >
            {clockInOut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
            퇴근하기
          </button>
        ) : (
          <button
            onClick={() => clockInOut.mutate('IN')}
            disabled={clockInOut.isPending}
            className="flex items-center gap-3 px-10 py-4 rounded-xl text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--color-success)' }}
          >
            {clockInOut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            {isClockedOut ? '재출근하기' : '출근하기'}
          </button>
        )}

        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {isClockedIn
            ? '퇴근 버튼을 누르면 상태가 "퇴근"으로 변경됩니다.'
            : isClockedOut
              ? '재출근 버튼을 누르면 다시 "근무중"으로 변경됩니다.'
              : '출근 버튼을 누르면 상태가 "근무중"으로 변경됩니다.'
          }
        </p>
      </section>
    </motion.div>
  );
}
