import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListTodo, ChevronRight, Loader2 } from 'lucide-react';
import { useMyTodayTasks } from '../../hooks/useProfile';
import StatusBadge from '../common/StatusBadge';

export default function TodayTasksPage() {
  const navigate = useNavigate();
  const { data: todayTasks = [], isLoading } = useMyTodayTasks();

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-2xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">오늘 할 일</h1>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          {todayTasks.length}건
        </span>
      </div>

      <section
        className="rounded-xl p-6 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">👏</div>
            <p className="text-base font-medium">오늘 할당된 일감이 없습니다</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>여유로운 하루 보내세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayTasks.map((t) => {
              const projColor = t.project?.color || 'var(--color-primary)';
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-lg transition-colors hover:brightness-95 cursor-pointer text-left w-full"
                  style={{ backgroundColor: 'var(--color-bg)' }}
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: projColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{t.project?.name}</span>
                      <StatusBadge status={t.status as never} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--color-border)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${t.progressTotal}%`, backgroundColor: projColor }}
                      />
                    </div>
                    <span className="text-xs tabular-nums font-medium w-8 text-right" style={{ color: projColor }}>
                      {t.progressTotal}%
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
