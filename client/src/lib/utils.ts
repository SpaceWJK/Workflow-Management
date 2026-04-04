import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

/** Tailwind class merge utility */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date string to localized format */
export function formatDate(date: string | Date | undefined, format = 'YYYY-MM-DD'): string {
  if (!date) return '-';
  return dayjs(date).format(format);
}

/** Format number as percentage string */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Calculate remaining days from today to target date */
export function remainingDays(dueDate: string): number {
  // 날짜만 비교 (UTC 시차 무시)
  const due = dueDate.slice(0, 10);
  const today = dayjs().format('YYYY-MM-DD');
  return dayjs(due).diff(dayjs(today), 'day');
}

/** Calculate expected progress based on start/due dates */
export function calcExpectedProgress(startDate: string, dueDate: string): number {
  const start = dayjs(startDate);
  const end = dayjs(dueDate);
  const today = dayjs();
  const totalDays = end.diff(start, 'day');
  if (totalDays <= 0) return 100;
  const elapsed = today.diff(start, 'day');
  return Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
}

/** Calculate required daily velocity to complete on time */
export function calcRequiredVelocity(progressTotal: number, dueDate: string): number {
  const remaining = 100 - progressTotal;
  const days = remainingDays(dueDate);
  if (days <= 0) return remaining > 0 ? 999 : 0;
  return Math.round((remaining / days) * 10) / 10;
}

/** Get velocity color class based on required velocity */
export function getVelocityColor(velocity: number): string {
  if (velocity <= 15) return 'var(--color-primary)';
  if (velocity <= 25) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/** Generate initials from name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
