export interface AcademicConfiguration {
  departmentId: string;
  departmentName?: string;
  maxAssignedPeriodsPerDay: number; // default 3, configurable to 4, 5, etc.
  allowCustomSubjects: boolean; // default true
  allowFutureEditing: boolean; // default true
  reminderIntervalMinutes: number; // default 30
  autoLockPastDays: boolean; // default true
  updatedBy?: string;
  updatedAt: string;
}

export interface SystemSettings {
  collegeName: string;
  collegeDomain: string; // e.g. "college.edu.in"
  enforceDomainCheck: boolean;
  academicYear: string;
  currentSemester: 'ODD' | 'EVEN';
  defaultMaxPeriods: number;
  maintenanceMode: boolean;
  updatedAt: string;
}
