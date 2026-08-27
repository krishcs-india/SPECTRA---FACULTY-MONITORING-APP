import { PeriodEntry } from '../types/schedule';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  assignedCount: number;
}

/**
 * Flexible validation for faculty schedule periods
 */
export function validateSchedulePeriods(
  periods: Record<string, PeriodEntry>
): ValidationResult {
  const assignedEntries = Object.values(periods).filter(
    (p) => p && (p.type === 'SUBJECT' || p.type === 'CUSTOM')
  );
  const assignedCount = assignedEntries.length;

  return {
    isValid: true,
    assignedCount,
  };
}

export function countAssignedPeriods(periods: Record<string, PeriodEntry> | undefined): number {
  if (!periods) return 0;
  return Object.values(periods).filter(
    (p) => p && (p.type === 'SUBJECT' || p.type === 'CUSTOM')
  ).length;
}

export function validateEmailDomain(email: string, allowedDomain?: string): boolean {
  if (!email) return false;
  if (!allowedDomain) return true;
  return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`);
}
