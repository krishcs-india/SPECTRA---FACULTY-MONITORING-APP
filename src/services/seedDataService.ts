import { KalyaniUser } from '../types/user';
import { Department } from '../types/department';
import { Period } from '../types/period';
import { Subject } from '../types/subject';
import { FacultySchedule } from '../types/schedule';
import { AcademicConfiguration, SystemSettings } from '../types/configuration';
import { getTodayDateString } from '../utils/dateUtils';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept_cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    active: true,
    hodUid: 'usr_hod_arun',
    hodName: 'Dr. Arun Kumar',
    ahodUid: 'usr_ahod_meena',
    ahodName: 'Dr. Meenakshi S.',
    ahodUids: ['usr_ahod_meena'],
    ahodNames: ['Dr. Meenakshi S.'],
    facultyCount: 10,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_ece',
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    active: true,
    hodUid: 'usr_hod_ece',
    hodName: 'Dr. R. Venkatesh',
    facultyCount: 8,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_mech',
    name: 'Mechanical Engineering',
    code: 'MECH',
    active: true,
    facultyCount: 6,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'dept_aids',
    name: 'Artificial Intelligence & Data Science',
    code: 'AI&DS',
    active: true,
    facultyCount: 5,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_PERIODS: Period[] = [
  {
    id: 'P01',
    name: 'Period 1',
    shortName: 'Period 1',
    startTime: '08:45',
    endTime: '09:35',
    sequence: 1,
    active: true,
  },
  {
    id: 'P02',
    name: 'Period 2',
    shortName: 'Period 2',
    startTime: '09:35',
    endTime: '10:25',
    sequence: 2,
    active: true,
  },
  {
    id: 'P03',
    name: 'Period 3',
    shortName: 'Period 3',
    startTime: '10:40',
    endTime: '11:30',
    sequence: 3,
    active: true,
  },
  {
    id: 'P04',
    name: 'Period 4',
    shortName: 'Period 4',
    startTime: '11:30',
    endTime: '12:20',
    sequence: 4,
    active: true,
  },
  {
    id: 'P05',
    name: 'Period 5',
    shortName: 'Period 5',
    startTime: '01:10',
    endTime: '02:00',
    sequence: 5,
    active: true,
  },
  {
    id: 'P06',
    name: 'Period 6',
    shortName: 'Period 6',
    startTime: '02:00',
    endTime: '02:50',
    sequence: 6,
    active: true,
  },
  {
    id: 'P07',
    name: 'Period 7',
    shortName: 'Period 7',
    startTime: '03:00',
    endTime: '03:50',
    sequence: 7,
    active: true,
  },
  {
    id: 'P08',
    name: 'Period 8',
    shortName: 'Period 8',
    startTime: '03:50',
    endTime: '04:40',
    sequence: 8,
    active: true,
  }
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_cs501',
    departmentId: 'dept_cse',
    subjectCode: 'CS501',
    subjectName: 'Database Management Systems (DBMS)',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs502',
    departmentId: 'dept_cse',
    subjectCode: 'CS502',
    subjectName: 'Operating Systems & Architecture (OS)',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs503',
    departmentId: 'dept_cse',
    subjectCode: 'CS503',
    subjectName: 'Computer Networks & Security (CN)',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs504',
    departmentId: 'dept_cse',
    subjectCode: 'CS504',
    subjectName: 'Artificial Intelligence & Machine Learning',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs505',
    departmentId: 'dept_cse',
    subjectCode: 'CS505',
    subjectName: 'Cloud Computing & Distributed Systems',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs506',
    departmentId: 'dept_cse',
    subjectCode: 'CS506',
    subjectName: 'Design & Analysis of Algorithms (DAA)',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs507',
    departmentId: 'dept_cse',
    subjectCode: 'CS507',
    subjectName: 'Full Stack Web & Mobile Engineering',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'sub_cs508',
    departmentId: 'dept_cse',
    subjectCode: 'CS508',
    subjectName: 'Compiler Design & Formal Languages',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_USERS: KalyaniUser[] = [
  {
    uid: 'usr_admin',
    name: 'Dr. K. S. Rajan',
    email: 'admin@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Principal & Chief Administrator',
    role: 'ADMIN',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_hod_arun',
    name: 'Dr. Arun Kumar',
    email: 'arun.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Professor & Head of Department',
    role: 'HOD',
    hodType: 'HOD',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_ahod_meena',
    name: 'Dr. Meenakshi Sundaram',
    email: 'meenakshi.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Assistant HOD',
    role: 'FACULTY',
    hodType: 'AHOD',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_priya',
    name: 'Prof. Priya Sharma',
    email: 'priya.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_karthik',
    name: 'Dr. Karthik Raman',
    email: 'karthik.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Assistant Professor (Senior)',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_divya',
    name: 'Prof. Divya Krishnan',
    email: 'divya.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_rajesh',
    name: 'Prof. Rajesh Varma',
    email: 'rajesh.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_ananya',
    name: 'Prof. Ananya Nair',
    email: 'ananya.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_suresh',
    name: 'Dr. Suresh Babu',
    email: 'suresh.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'Professor',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    uid: 'usr_deepa',
    name: 'Prof. Deepa Sundaram',
    email: 'deepa.cse@krce.ac.in',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    designation: 'DA Madam / Assistant Professor',
    role: 'FACULTY',
    hodType: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

export const INITIAL_CONFIGS: Record<string, AcademicConfiguration> = {
  dept_cse: {
    departmentId: 'dept_cse',
    departmentName: 'Computer Science & Engineering',
    maxAssignedPeriodsPerDay: 3, // Default 3, dynamically configurable to 4, 5, etc.
    allowCustomSubjects: true,
    allowFutureEditing: true,
    reminderIntervalMinutes: 30,
    autoLockPastDays: true,
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
};

export const INITIAL_SETTINGS: SystemSettings = {
  collegeName: 'K. RAMAKRISHNAN COLLEGE OF ENGINEERING',
  collegeDomain: 'krce.ac.in',
  enforceDomainCheck: false,
  academicYear: '2026-2027',
  currentSemester: 'ODD',
  defaultMaxPeriods: 3,
  maintenanceMode: false,
  updatedAt: '2026-01-01T00:00:00.000Z'
};

export function generateInitialSchedules(): Record<string, FacultySchedule> {
  const today = getTodayDateString();
  const schedules: Record<string, FacultySchedule> = {};

  // 1. Dr. Arun Kumar (HOD) - SUBMITTED with 3 periods
  schedules[`usr_hod_arun_${today}`] = {
    id: `usr_hod_arun_${today}`,
    facultyId: 'usr_hod_arun',
    facultyName: 'Dr. Arun Kumar',
    facultyDesignation: 'Professor & Head of Department',
    facultyEmail: 'arun.cse@krce.ac.in',
    departmentId: 'dept_cse',
    date: today,
    status: 'SUBMITTED',
    periods: {
      P01: { type: 'SUBJECT', subjectId: 'sub_cs501', subjectCode: 'CS501', subjectName: 'Database Management Systems (DBMS)' },
      P02: { type: 'FREE' },
      P03: { type: 'SUBJECT', subjectId: 'sub_cs502', subjectCode: 'CS502', subjectName: 'Operating Systems & Architecture (OS)' },
      P04: { type: 'FREE' },
      P05: { type: 'SUBJECT', subjectId: 'sub_cs504', subjectCode: 'CS504', subjectName: 'Artificial Intelligence & Machine Learning' },
      P06: { type: 'FREE' },
      P07: { type: 'FREE' },
      P08: { type: 'FREE' }
    },
    submittedAt: `${today}T08:30:00.000Z`,
    updatedAt: `${today}T08:30:00.000Z`
  };

  // 2. Prof. Priya Sharma - FULL_DAY_FREE
  schedules[`usr_priya_${today}`] = {
    id: `usr_priya_${today}`,
    facultyId: 'usr_priya',
    facultyName: 'Prof. Priya Sharma',
    facultyDesignation: 'Associate Professor',
    facultyEmail: 'priya.cse@krce.ac.in',
    departmentId: 'dept_cse',
    date: today,
    status: 'FULL_DAY_FREE',
    periods: {
      P01: { type: 'FREE' },
      P02: { type: 'FREE' },
      P03: { type: 'FREE' },
      P04: { type: 'FREE' },
      P05: { type: 'FREE' },
      P06: { type: 'FREE' },
      P07: { type: 'FREE' },
      P08: { type: 'FREE' }
    },
    submittedAt: `${today}T08:15:00.000Z`,
    updatedAt: `${today}T08:15:00.000Z`
  };

  // 3. Dr. Karthik Raman - SUBMITTED with Custom Other
  schedules[`usr_karthik_${today}`] = {
    id: `usr_karthik_${today}`,
    facultyId: 'usr_karthik',
    facultyName: 'Dr. Karthik Raman',
    facultyDesignation: 'Assistant Professor (Senior)',
    facultyEmail: 'karthik.cse@krce.ac.in',
    departmentId: 'dept_cse',
    date: today,
    status: 'SUBMITTED',
    periods: {
      P01: { type: 'FREE' },
      P02: { type: 'SUBJECT', subjectId: 'sub_cs503', subjectCode: 'CS503', subjectName: 'Computer Networks & Security (CN)' },
      P03: { type: 'FREE' },
      P04: { type: 'SUBJECT', subjectId: 'sub_cs505', subjectCode: 'CS505', subjectName: 'Cloud Computing & Distributed Systems' },
      P05: { type: 'FREE' },
      P06: { type: 'CUSTOM', customText: 'Final Year Major Project Review' },
      P07: { type: 'FREE' },
      P08: { type: 'FREE' }
    },
    submittedAt: `${today}T08:40:00.000Z`,
    updatedAt: `${today}T08:40:00.000Z`
  };

  // 4. Prof. Rajesh Varma - SUBMITTED with 2 periods
  schedules[`usr_rajesh_${today}`] = {
    id: `usr_rajesh_${today}`,
    facultyId: 'usr_rajesh',
    facultyName: 'Prof. Rajesh Varma',
    facultyDesignation: 'Assistant Professor',
    facultyEmail: 'rajesh.cse@krce.ac.in',
    departmentId: 'dept_cse',
    date: today,
    status: 'SUBMITTED',
    periods: {
      P01: { type: 'SUBJECT', subjectId: 'sub_cs506', subjectCode: 'CS506', subjectName: 'Design & Analysis of Algorithms (DAA)' },
      P02: { type: 'FREE' },
      P03: { type: 'FREE' },
      P04: { type: 'FREE' },
      P05: { type: 'FREE' },
      P06: { type: 'FREE' },
      P07: { type: 'SUBJECT', subjectId: 'sub_cs508', subjectCode: 'CS508', subjectName: 'Compiler Design & Formal Languages' },
      P08: { type: 'FREE' }
    },
    submittedAt: `${today}T08:50:00.000Z`,
    updatedAt: `${today}T08:50:00.000Z`
  };

  // 5. Prof. Deepa Sundaram - SUBMITTED
  schedules[`usr_deepa_${today}`] = {
    id: `usr_deepa_${today}`,
    facultyId: 'usr_deepa',
    facultyName: 'Prof. Deepa Sundaram',
    facultyDesignation: 'DA Madam / Assistant Professor',
    facultyEmail: 'deepa.cse@krce.ac.in',
    departmentId: 'dept_cse',
    date: today,
    status: 'SUBMITTED',
    periods: {
      P01: { type: 'FREE' },
      P02: { type: 'FREE' },
      P03: { type: 'SUBJECT', subjectId: 'sub_cs507', subjectCode: 'CS507', subjectName: 'Full Stack Web & Mobile Engineering' },
      P04: { type: 'FREE' },
      P05: { type: 'CUSTOM', customText: 'Department NBA Accreditation Meeting' },
      P06: { type: 'FREE' },
      P07: { type: 'FREE' },
      P08: { type: 'FREE' }
    },
    submittedAt: `${today}T09:00:00.000Z`,
    updatedAt: `${today}T09:00:00.000Z`
  };

  // Prof. Divya Krishnan & Prof. Ananya Nair & Dr. Suresh Babu remain NOT_SUBMITTED (unresponsive)

  return schedules;
}
