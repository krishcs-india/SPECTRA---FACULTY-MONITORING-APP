import { KalyaniUser } from '../types/user';
import { Department } from '../types/department';
import { Period } from '../types/period';
import { Subject } from '../types/subject';
import { FacultySchedule } from '../types/schedule';
import { SystemSettings } from '../types/configuration';

/**
 * Universal Department ID normalizer.
 * Standardizes any department code to uppercase trimmed string (e.g. 'CSE', 'AIDS').
 */
export const normalizeDepartmentId = (deptId?: string | null): string => {
  if (!deptId) return '';
  return deptId.trim().toUpperCase();
};

/**
 * Returns human-readable department display title.
 */
export const getDepartmentDisplayName = (deptId?: string | null): string => {
  const norm = normalizeDepartmentId(deptId);
  const matched = INITIAL_DEPARTMENTS.find((d) => d.id === norm || d.code === norm);
  return matched ? matched.name : norm || 'Department';
};

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'CSE',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    active: true,
    hodUid: null,
    hodName: null,
    ahodUid: null,
    ahodName: null,
    ahodUids: [],
    ahodNames: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'AIDS',
    name: 'Artificial Intelligence & Data Science',
    code: 'AIDS',
    active: true,
    hodUid: null,
    hodName: null,
    ahodUid: null,
    ahodName: null,
    ahodUids: [],
    ahodNames: [],
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const createDefaultPeriodsForDepartment = (deptId: string): Period[] => {
  const clean = normalizeDepartmentId(deptId) || 'CSE';
  const timings = [
    { start: '08:45', end: '09:35' },
    { start: '09:35', end: '10:25' },
    { start: '10:40', end: '11:30' },
    { start: '11:30', end: '12:20' },
    { start: '01:10', end: '02:00' },
    { start: '02:00', end: '02:50' },
    { start: '03:00', end: '03:50' },
    { start: '03:50', end: '04:40' },
  ];
  return timings.map((t, idx) => {
    const seq = idx + 1;
    return {
      id: `P_${clean}_${seq}`,
      departmentId: clean,
      name: `Period ${seq}`,
      shortName: `Period ${seq}`,
      startTime: t.start,
      endTime: t.end,
      sequence: seq,
      active: true,
    };
  });
};

export const INITIAL_PERIODS: Period[] = [
  ...createDefaultPeriodsForDepartment('CSE'),
  ...createDefaultPeriodsForDepartment('AIDS'),
];

export const INITIAL_SUBJECTS: Subject[] = [];

export const INITIAL_USERS: KalyaniUser[] = [
  {
    uid: 'usr_admin',
    name: 'ADMINISTRATOR',
    email: 'admin@krce.ac.in',
    departmentId: '',
    departmentName: 'Institutional Administration',
    designation: 'System Administrator',
    role: 'ADMIN',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_SETTINGS: SystemSettings = {
  collegeName: 'K. RAMAKRISHNAN COLLEGE OF ENGINEERING',
  collegeDomain: 'krce.ac.in',
  maintenanceMode: false,
  updatedAt: '2026-01-01T00:00:00.000Z'
};

export function generateInitialSchedules(): Record<string, FacultySchedule> {
  return {};
}
