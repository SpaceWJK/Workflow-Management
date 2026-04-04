import { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { useTimerStatus, useStartTimer, useStopTimer } from '../../hooks/useTimer';

interface TimerButtonProps {
  taskId: number;
  compact?: boolean;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerButton({ taskId, compact = false }: TimerButtonProps) {
  const { data: timerStatus } = useTimerStatus(taskId);
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();

  const [elapsed, setElapsed] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerStatus?.isRunning && timerStatus.currentLog) {
      setElapsed(timerStatus.currentLog.elapsed);
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsed(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerStatus?.isRunning, timerStatus?.currentLog?.elapsed]);

  const isRunning = timerStatus?.isRunning ?? false;
  const isPending = startTimer.isPending || stopTimer.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      stopTimer.mutate(taskId);
    } else {
      startTimer.mutate(taskId);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label={isRunning ? '타이머 정지' : '타이머 시작'}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
        style={{
          backgroundColor: isRunning
            ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)'
            : 'color-mix(in srgb, var(--color-success) 15%, transparent)',
          color: isRunning ? 'var(--color-danger)' : 'var(--color-success)',
        }}
      >
        {isRunning ? (
          <>
            <Square className="w-3 h-3" />
            <span className="tabular-nums">{formatElapsed(elapsed)}</span>
          </>
        ) : (
          <Play className="w-3 h-3" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={isRunning ? '타이머 정지' : '타이머 시작'}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      style={{
        backgroundColor: isRunning
          ? 'color-mix(in srgb, var(--color-danger) 15%, transparent)'
          : 'color-mix(in srgb, var(--color-success) 15%, transparent)',
        color: isRunning ? 'var(--color-danger)' : 'var(--color-success)',
        border: `1px solid ${isRunning ? 'var(--color-danger)' : 'var(--color-success)'}`,
      }}
    >
      {isRunning ? (
        <>
          <Square className="w-4 h-4" />
          <span className="tabular-nums">{formatElapsed(elapsed)}</span>
          <span>정지</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4" />
          <span>타이머 시작</span>
        </>
      )}
    </button>
  );
}
