import { format, parseISO, isBefore, startOfDay, addDays } from 'date-fns';

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateDisplay(dateStr: string): string {
  try {
    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(parsed, 'EEEE, d MMMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(parsed, 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTimeDisplay(dateVal: string | Date | undefined): string {
  if (!dateVal) return '—';
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '—';
    return format(d, 'h:mm a'); // e.g. "2:00 PM" without extra seconds
  } catch {
    return '—';
  }
}

export function formatDayName(dateStr: string): string {
  try {
    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(parsed, 'EEE');
  } catch {
    return '';
  }
}

export function isPastDate(dateStr: string): boolean {
  try {
    const target = startOfDay(parseISO(dateStr));
    const today = startOfDay(new Date());
    return isBefore(target, today);
  } catch {
    return false;
  }
}

export function isTodayDate(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function isFutureDate(dateStr: string): boolean {
  try {
    const target = startOfDay(parseISO(dateStr));
    const today = startOfDay(new Date());
    return target.getTime() > today.getTime();
  } catch {
    return false;
  }
}

export const RETENTION_PAST_DAYS = 6;

/**
 * Returns the earliest date string in the retention window (today minus 6 days)
 * e.g., if today is 2026-08-27, returns 2026-08-21
 */
export function getMinRetentionDateString(): string {
  try {
    const today = startOfDay(new Date());
    const minDate = addDays(today, -RETENTION_PAST_DAYS);
    return format(minDate, 'yyyy-MM-dd');
  } catch {
    return getTodayDateString();
  }
}

/**
 * Returns true if dateStr is strictly older than 6 days from today
 */
export function isDateExpiredBeyondRetention(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const target = startOfDay(parseISO(dateStr));
    const minAllowed = startOfDay(addDays(new Date(), -RETENTION_PAST_DAYS));
    return isBefore(target, minAllowed);
  } catch {
    return false;
  }
}

/**
 * Returns true if dateStr is within the retention window:
 * (Today - 6 days) <= dateStr <= any future date
 */
export function isDateWithinRetentionWindow(dateStr: string): boolean {
  return !isDateExpiredBeyondRetention(dateStr);
}

export function getNearbyDates(baseDateStr: string = getTodayDateString(), range: number = 7): string[] {
  try {
    const base = parseISO(baseDateStr);
    const dates: string[] = [];
    for (let i = -3; i <= range - 4; i++) {
      dates.push(format(addDays(base, i), 'yyyy-MM-dd'));
    }
    return dates;
  } catch {
    return [getTodayDateString()];
  }
}
