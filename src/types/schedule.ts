export type PeriodEntryType = 'SUBJECT' | 'CUSTOM' | 'FREE' | 'LEAVE' | 'ON_DUTY';

export interface PeriodEntry {
  type: PeriodEntryType;
  subjectId?: string; // when type === 'SUBJECT'
  subjectCode?: string;
  subjectName?: string;
  customText?: string; // when type === 'CUSTOM'
  // Leave metadata
  leaveType?: 'FULL_DAY' | 'HALF_DAY' | 'PERIOD_WISE';
  leaveReason?: string;
  // On Duty metadata
  onDutyType?: 'FULL_DAY' | 'HALF_DAY' | 'PERIOD_WISE';
  onDutyCategory?: string; // Exam Duty, Cultural, Placement, Coding Event, FDP, Other
  onDutyReason?: string;
}

export type ScheduleStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'FULL_DAY_FREE'
  | 'ON_DUTY'
  | 'LEAVE';

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
  onDutyFacultyCount: number;
  leaveFacultyCount: number;
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
  onDutyFaculty: {
    facultyId: string;
    facultyName: string;
    facultyDesignation: string;
    category: string;
    reason: string;
  }[];
  leaveFaculty: {
    facultyId: string;
    facultyName: string;
    facultyDesignation: string;
    reason: string;
  }[];
}

export interface DayAvailabilityOverview {
  date: string;
  totalFaculty: number;
  submittedCount: number;
  fullDayFreeCount: number;
  onDutyCount: number;
  leaveCount: number;
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
    onDutyPeriodsCount: number;
    leavePeriodsCount: number;
    schedule?: FacultySchedule;
  }[];
  periodAvailability: PeriodAvailabilitySummary[];
}

