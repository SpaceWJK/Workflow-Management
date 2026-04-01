import dayjs from 'dayjs';

interface TodayIndicatorLineProps {
  startDate: dayjs.Dayjs;
  dayWidth: number;
}

export default function TodayIndicatorLine({ startDate, dayWidth }: TodayIndicatorLineProps) {
  const today = dayjs().startOf('day');
  const offset = today.diff(startDate, 'day');

  if (offset < 0) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none"
      style={{
        left: `${offset * dayWidth + dayWidth / 2}px`,
        backgroundColor: 'var(--color-danger)',
      }}
    >
      <div
        className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: 'var(--color-danger)' }}
      />
    </div>
  );
}
