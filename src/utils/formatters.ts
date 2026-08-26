import { ScheduleStatus } from '../types/schedule';

export function getStatusBadgeInfo(status: ScheduleStatus) {
  switch (status) {
    case 'SUBMITTED':
      return {
        label: 'Submitted',
        variant: 'emerald' as const,
        bgClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
        dotClass: 'bg-emerald-400',
      };
    case 'FULL_DAY_FREE':
      return {
        label: 'Full Day Free',
        variant: 'teal' as const,
        bgClass: 'bg-teal-950/80 border-teal-500/40 text-teal-300',
        dotClass: 'bg-teal-400',
      };
    case 'NOT_SUBMITTED':
    default:
      return {
        label: 'Not Submitted',
        variant: 'ruby' as const,
        bgClass: 'bg-rose-950/80 border-rose-500/40 text-rose-300',
        dotClass: 'bg-rose-400 animate-pulse',
      };
  }
}

export function formatPeriodTiming(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

export function truncateText(text: string, maxLength: number = 30): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
}
