export type PeriodEntryType = 'SUBJECT' | 'CUSTOM' | 'FREE';

export interface PeriodEntry {
  type: PeriodEntryType;
  subjectId?: string; // when type === 'SUBJECT'
  subjectCode?: string;
  subjectName?: string;
  customText?: string; // when type === 'CUSTOM'
}

export type ScheduleStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'FULL_DAY_FREE';

export interface FacultySchedule {
  id: string; // Key format: `${facultyId}_${date}`
  facultyId: string;
  facultyName: string;
  facultyDesignation?: string;
  facultyEmail?: string;
  departmentId: string;
  date: string; // ISO format: YYYY-MM-DD
  status: ScheduleStatus;
  periods: Record<string, PeriodEntry>; // Keyed strictly by canonical periodId (e.g. "P_CSE_1", "P_CSE_2"...)
  submittedAt?: string;
  updatedAt?: string;
  notes?: string;
}

export interface PeriodAvailabilitySummary {
  periodId: string;
  periodName: string;
  shortName: string;
  startTime: string;
  endTime: string;
  sequence: number;
  freeFacultyCount: number;
  busyFacultyCount: number;
  freeFaculty: {
    facultyId: string;
    facultyName: string;
    facultyDesignation: string;
    email: string;
  }[];
  busyFaculty: {
    facultyId: string;
    facultyName: string;
    facultyDesignation: string;
    activity: string; // Subject code + name, or custom text
    entryType: PeriodEntryType;
  }[];
}

export interface DayAvailabilityOverview {
  date: string;
  totalFaculty: number;
  submittedCount: number;
  fullDayFreeCount: number;
  notSubmittedCount: number;
  submissionPercentage: number;
  facultyStatuses: {
    facultyId: string;
    facultyName: string;
    facultyDesignation: string;
    email: string;
    status: ScheduleStatus;
    submittedAt?: string;
    assignedPeriodsCount: number;
    schedule?: FacultySchedule;
  }[];
  periodAvailability: PeriodAvailabilitySummary[];
}
