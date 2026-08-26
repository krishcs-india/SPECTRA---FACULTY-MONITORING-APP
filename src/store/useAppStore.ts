import { create } from 'zustand';
import { KalyaniUser, UserRole, HodType } from '../types/user';
import { Department } from '../types/department';
import { Period } from '../types/period';
import { Subject } from '../types/subject';
import { FacultySchedule, PeriodEntry, DayAvailabilityOverview, PeriodAvailabilitySummary } from '../types/schedule';
import { AcademicConfiguration, SystemSettings } from '../types/configuration';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_PERIODS,
  INITIAL_SUBJECTS,
  INITIAL_CONFIGS,
  INITIAL_SETTINGS,
  generateInitialSchedules
} from '../services/seedDataService';
import { firestoreService } from '../services/firestoreService';
import { isLiveFirebaseConfigured } from '../config/firebase';
import { getTodayDateString } from '../utils/dateUtils';
import { validateSchedulePeriods } from '../utils/validation';

interface AppStoreState {
  users: KalyaniUser[];
  departments: Department[];
  periods: Period[];
  subjects: Subject[];
  schedules: Record<string, FacultySchedule>;
  academicConfigs: Record<string, AcademicConfiguration>;
  systemSettings: SystemSettings;
  isInitialized: boolean;

  // Initialization & Reset
  initStore: () => void;
  resetToDefaults: () => void;

  // Schedule Actions
  getSchedule: (facultyId: string, date: string) => FacultySchedule | null;
  submitSchedule: (facultyId: string, date: string, periods: Record<string, PeriodEntry>) => { success: boolean; error?: string };
  submitFullDayFree: (facultyId: string, date: string) => { success: boolean; error?: string };
  getDepartmentAvailability: (departmentId: string, date: string) => DayAvailabilityOverview;
  getFacultyHistory: (facultyId: string) => FacultySchedule[];

  // Subject Actions
  getDepartmentSubjects: (departmentId: string) => Subject[];
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => Subject;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  toggleSubjectActive: (id: string, active: boolean) => void;
  bulkDeleteSubjects: (ids: string[]) => void;
  bulkImportSubjects: (departmentId: string, subjects: Omit<Subject, 'id' | 'departmentId' | 'createdAt' | 'updatedAt'>[]) => number;

  // Period Actions
  getActivePeriods: (departmentId?: string) => Period[];
  getAllDepartmentPeriods: (departmentId?: string) => Period[];
  getAllPeriods: () => Period[];
  addPeriod: (period: Omit<Period, 'id'>) => Period;
  updatePeriod: (id: string, updates: Partial<Period>) => void;
  deletePeriod: (id: string) => void;

  // User Management Actions
  addUser: (user: Omit<KalyaniUser, 'uid' | 'createdAt' | 'updatedAt'>) => KalyaniUser;
  updateUser: (uid: string, updates: Partial<KalyaniUser>) => void;
  deleteUser: (uid: string) => void;
  bulkImportUsers: (newUsers: Omit<KalyaniUser, 'uid' | 'createdAt' | 'updatedAt'>[]) => number;
  assignHod: (departmentId: string, userUid: string, type: 'HOD' | 'AHOD') => void;
  removeAhod: (departmentId: string, userUid: string) => void;

  // Configuration Actions
  getDepartmentConfig: (departmentId: string) => AcademicConfiguration;
  updateDepartmentConfig: (departmentId: string, updates: Partial<AcademicConfiguration>) => void;
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;

  // Department Actions
  addDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;

  // System & Database Reset Actions
  purgeDatabaseToCleanSlate: () => void;
}

const STORAGE_KEY = 'kalyani_system_storage_v2';

// Guards against double initialization (React StrictMode mounts effects twice),
// which would attach duplicate Firestore listeners that are never torn down
let storeInitStarted = false;

export const useAppStore = create<AppStoreState>((set, get) => ({
  users: INITIAL_USERS,
  departments: INITIAL_DEPARTMENTS,
  periods: INITIAL_PERIODS,
  subjects: INITIAL_SUBJECTS,
  schedules: {},
  academicConfigs: INITIAL_CONFIGS,
  systemSettings: INITIAL_SETTINGS,
  isInitialized: false,

  initStore: () => {
    if (storeInitStarted) return;
    storeInitStarted = true;

    const sanitizeUsers = (userList: KalyaniUser[]): KalyaniUser[] => {
      return userList.map((u) => {
        let email = u.email;
        if (email.includes('@kalyani.college.edu.in') || email.includes('@college.edu.in')) {
          email = email.replace(/@(kalyani\.college\.edu\.in|college\.edu\.in)/g, '@krce.ac.in');
        }
        let role = u.role;
        let hodType = u.hodType;
        let designation = u.designation;

        if (u.uid === 'usr_ahod_meena' || hodType === 'AHOD') {
          role = 'FACULTY';
          hodType = 'AHOD';
          designation = 'Assistant HOD';
        }

        return {
          ...u,
          email,
          role,
          hodType,
          designation
        };
      });
    };

    const sanitizeSettings = (settings?: Partial<SystemSettings>): SystemSettings => {
      return {
        ...INITIAL_SETTINGS,
        ...(settings || {}),
        // Only fall back to institutional defaults when the admin hasn't saved one
        collegeName: settings?.collegeName || INITIAL_SETTINGS.collegeName,
        collegeDomain: settings?.collegeDomain || INITIAL_SETTINGS.collegeDomain
      };
    };

    // 1. Initialize local cache
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const updatedPeriods = (parsed.periods || INITIAL_PERIODS).map((p: any) => ({
          ...p,
          name: p.name.includes('Period') ? p.name.replace(/(\d+)(st|nd|rd|th)\s+Period/i, 'Period $1') : `Period ${p.sequence}`,
          shortName: p.shortName.startsWith('P') && p.shortName.length <= 3 ? `Period ${p.sequence}` : p.shortName
        }));

        const updatedDepts = (parsed.departments || INITIAL_DEPARTMENTS).map((d: Department) => {
          const uids = d.ahodUids || (d.ahodUid ? [d.ahodUid] : []);
          const names = d.ahodNames || (d.ahodName ? [d.ahodName] : []);
          return {
            ...d,
            ahodUids: uids,
            ahodNames: names
          };
        });

        const cleanUsers = sanitizeUsers(parsed.users || INITIAL_USERS);
        const cleanSettings = sanitizeSettings(parsed.systemSettings);

        set({
          users: cleanUsers,
          departments: updatedDepts,
          periods: updatedPeriods,
          subjects: parsed.subjects || INITIAL_SUBJECTS,
          schedules: isLiveFirebaseConfigured
            ? (parsed.schedules || {})
            : { ...generateInitialSchedules(), ...(parsed.schedules || {}) },
          academicConfigs: parsed.academicConfigs || INITIAL_CONFIGS,
          systemSettings: cleanSettings,
          isInitialized: true
        });

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...get(),
            users: cleanUsers,
            systemSettings: cleanSettings
          }));
        } catch {}
      } else {
        const initialSchedules = isLiveFirebaseConfigured ? {} : generateInitialSchedules();
        const cleanUsers = sanitizeUsers(INITIAL_USERS);
        set({
          users: cleanUsers,
          departments: INITIAL_DEPARTMENTS,
          periods: INITIAL_PERIODS,
          subjects: INITIAL_SUBJECTS,
          schedules: initialSchedules,
          academicConfigs: INITIAL_CONFIGS,
          systemSettings: INITIAL_SETTINGS,
          isInitialized: true
        });
      }
    } catch (e) {
      console.warn('Failed to load storage, initializing fresh seed data', e);
    }

    // Refresh active session with sanitized credentials
    try {
      import('./useAuthStore').then((m) => m.useAuthStore.getState().refreshActiveUser());
    } catch {}

    // 2. Attach live real-time Firestore database listeners & seed if needed
    firestoreService.ensureDatabaseInitialized();

    firestoreService.subscribeSchedules((incomingSchedules) => {
      set((prev) => {
        const merged = { ...prev.schedules, ...incomingSchedules };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, schedules: merged }));
        } catch {}
        return { schedules: merged };
      });
    });

    firestoreService.subscribeUsers((incomingUsers) => {
      if (incomingUsers.length > 0) {
        const cleanUsers = sanitizeUsers(incomingUsers);
        set((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, users: cleanUsers }));
          } catch {}
          return { users: cleanUsers };
        });
        try {
          import('./useAuthStore').then((m) => m.useAuthStore.getState().refreshActiveUser());
        } catch {}
      }
    });

    firestoreService.subscribeDepartments((incomingDepts) => {
      if (incomingDepts.length > 0) {
        set((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, departments: incomingDepts }));
          } catch {}
          return { departments: incomingDepts };
        });
      }
    });

    firestoreService.subscribeSubjects((incomingSubjects) => {
      if (incomingSubjects.length > 0) {
        set((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, subjects: incomingSubjects }));
          } catch {}
          return { subjects: incomingSubjects };
        });
      }
    });

    firestoreService.subscribePeriods((incomingPeriods) => {
      if (incomingPeriods.length > 0) {
        set((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, periods: incomingPeriods }));
          } catch {}
          return { periods: incomingPeriods };
        });
      }
    });

    firestoreService.subscribeSystemSettings((incomingSettings) => {
      if (incomingSettings) {
        set((prev) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, systemSettings: incomingSettings }));
          } catch {}
          return { systemSettings: incomingSettings };
        });
      }
    });

    firestoreService.subscribeAcademicConfigs((incomingConfigs) => {
      if (incomingConfigs && Object.keys(incomingConfigs).length > 0) {
        set((prev) => {
          const merged = { ...prev.academicConfigs, ...incomingConfigs };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, academicConfigs: merged }));
          } catch {}
          return { academicConfigs: merged };
        });
      }
    });
  },

  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEY);
    const initialSchedules = generateInitialSchedules();
    set({
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      periods: INITIAL_PERIODS,
      subjects: INITIAL_SUBJECTS,
      schedules: initialSchedules,
      academicConfigs: INITIAL_CONFIGS,
      systemSettings: INITIAL_SETTINGS
    });
  },

  getSchedule: (facultyId: string, date: string) => {
    const key = `${facultyId}_${date}`;
    return get().schedules[key] || null;
  },

  submitSchedule: (facultyId: string, date: string, periods: Record<string, PeriodEntry>) => {
    const state = get();
    const faculty = state.users.find(u => u.uid === facultyId);
    if (!faculty) {
      return { success: false, error: 'Faculty record not found' };
    }

    const deptConfig = state.getDepartmentConfig(faculty.departmentId);
    const maxAllowed = deptConfig?.maxAssignedPeriodsPerDay ?? 3;

    // Dynamic validation
    const validation = validateSchedulePeriods(periods, maxAllowed);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const key = `${facultyId}_${date}`;
    const now = new Date().toISOString();

    const newSchedule: FacultySchedule = {
      id: key,
      facultyId,
      facultyName: faculty.name,
      facultyDesignation: faculty.designation,
      facultyEmail: faculty.email,
      departmentId: faculty.departmentId,
      date,
      status: 'SUBMITTED',
      periods,
      submittedAt: now,
      updatedAt: now
    };

    const nextSchedules = { ...state.schedules, [key]: newSchedule };
    set({ schedules: nextSchedules });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), schedules: nextSchedules }));
    } catch {}

    // Cloud Firestore Sync
    firestoreService.saveSchedule(newSchedule);

    return { success: true };
  },

  submitFullDayFree: (facultyId: string, date: string) => {
    const state = get();
    const faculty = state.users.find(u => u.uid === facultyId);
    if (!faculty) {
      return { success: false, error: 'Faculty record not found' };
    }

    const activePeriods = state.getActivePeriods(faculty.departmentId);
    const freePeriods: Record<string, PeriodEntry> = {};
    activePeriods.forEach(p => {
      freePeriods[p.id] = { type: 'FREE' };
    });

    const key = `${facultyId}_${date}`;
    const now = new Date().toISOString();

    const newSchedule: FacultySchedule = {
      id: key,
      facultyId,
      facultyName: faculty.name,
      facultyDesignation: faculty.designation,
      facultyEmail: faculty.email,
      departmentId: faculty.departmentId,
      date,
      status: 'FULL_DAY_FREE',
      periods: freePeriods,
      submittedAt: now,
      updatedAt: now
    };

    const nextSchedules = { ...state.schedules, [key]: newSchedule };
    set({ schedules: nextSchedules });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), schedules: nextSchedules }));
    } catch {}

    // Cloud Firestore Sync
    firestoreService.saveSchedule(newSchedule);

    return { success: true };
  },

  getDepartmentAvailability: (departmentId: string, date: string): DayAvailabilityOverview => {
    const state = get();
    // Only include teaching faculty and Assistant HODs (AHOD). Exclude Main HOD and Administrator from faculty submissions roster
    const deptFaculty = state.users.filter(
      u => u.departmentId === departmentId &&
           u.active &&
           u.role !== 'ADMIN' &&
           (u.role !== 'HOD' || u.hodType === 'AHOD')
    );
    const activePeriods = state.getAllDepartmentPeriods(departmentId);

    let submittedCount = 0;
    let fullDayFreeCount = 0;
    let notSubmittedCount = 0;

    const facultyStatuses = deptFaculty.map(faculty => {
      const key = `${faculty.uid}_${date}`;
      const schedule = state.schedules[key];

      let status: FacultySchedule['status'] = 'NOT_SUBMITTED';
      let assignedCount = 0;

      if (schedule) {
        status = schedule.status;
        if (status === 'SUBMITTED') {
          submittedCount++;
          assignedCount = Object.values(schedule.periods || {}).filter(
            p => p && p.type !== 'FREE'
          ).length;
        } else if (status === 'FULL_DAY_FREE') {
          fullDayFreeCount++;
          assignedCount = 0;
        } else {
          notSubmittedCount++;
        }
      } else {
        notSubmittedCount++;
      }

      return {
        facultyId: faculty.uid,
        facultyName: faculty.name,
        facultyDesignation: faculty.designation,
        email: faculty.email,
        status,
        submittedAt: schedule?.submittedAt,
        assignedPeriodsCount: assignedCount,
        schedule
      };
    });

    // Build period-wise matrix
    const periodAvailability: PeriodAvailabilitySummary[] = activePeriods.map(period => {
      const freeFaculty: PeriodAvailabilitySummary['freeFaculty'] = [];
      const busyFaculty: PeriodAvailabilitySummary['busyFaculty'] = [];

      deptFaculty.forEach(faculty => {
        const key = `${faculty.uid}_${date}`;
        const schedule = state.schedules[key];

        // ONLY count faculty who have explicitly submitted or marked full day free
        if (!schedule || schedule.status === 'NOT_SUBMITTED') {
          return;
        }

        if (schedule.status === 'FULL_DAY_FREE') {
          freeFaculty.push({
            facultyId: faculty.uid,
            facultyName: faculty.name,
            facultyDesignation: faculty.designation,
            email: faculty.email
          });
          return;
        }

        const entry = schedule.periods[period.id];
        if (!entry || entry.type === 'FREE') {
          freeFaculty.push({
            facultyId: faculty.uid,
            facultyName: faculty.name,
            facultyDesignation: faculty.designation,
            email: faculty.email
          });
        } else {
          let activity = 'Assigned';
          if (entry.type === 'SUBJECT') {
            activity = `${entry.subjectCode || ''} ${entry.subjectName || ''}`.trim();
          } else if (entry.type === 'CUSTOM') {
            activity = `Other: ${entry.customText || 'Custom Entry'}`;
          }

          busyFaculty.push({
            facultyId: faculty.uid,
            facultyName: faculty.name,
            facultyDesignation: faculty.designation,
            activity,
            entryType: entry.type
          });
        }
      });

      return {
        periodId: period.id,
        periodName: period.name,
        shortName: period.shortName,
        startTime: period.startTime,
        endTime: period.endTime,
        sequence: period.sequence,
        freeFacultyCount: freeFaculty.length,
        busyFacultyCount: busyFaculty.length,
        freeFaculty,
        busyFaculty
      };
    });

    const total = deptFaculty.length;
    const answered = submittedCount + fullDayFreeCount;
    const submissionPercentage = total > 0 ? Math.round((answered / total) * 100) : 0;

    return {
      date,
      totalFaculty: total,
      submittedCount,
      fullDayFreeCount,
      notSubmittedCount,
      submissionPercentage,
      facultyStatuses,
      periodAvailability
    };
  },

  getFacultyHistory: (facultyId: string): FacultySchedule[] => {
    const state = get();
    return Object.values(state.schedules)
      .filter(s => s.facultyId === facultyId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getDepartmentSubjects: (departmentId: string) => {
    return get().subjects
      .filter(s => s.departmentId === departmentId && s.active)
      .sort((a, b) => a.subjectCode.localeCompare(b.subjectCode));
  },

  addSubject: (subjectData) => {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const newSubject: Subject = {
      ...subjectData,
      id,
      createdAt: now,
      updatedAt: now
    };
    const next = [...get().subjects, newSubject];
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    firestoreService.saveSubject(newSubject);
    return newSubject;
  },

  updateSubject: (id, updates) => {
    let updated: Subject | undefined;
    const next = get().subjects.map(s => {
      if (s.id === id) {
        updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return s;
    });
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    if (updated) firestoreService.saveSubject(updated);
  },

  deleteSubject: (id) => {
    const next = get().subjects.filter(s => s.id !== id);
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    firestoreService.deleteSubject(id);
  },

  toggleSubjectActive: (id, active) => {
    let updated: Subject | undefined;
    const next = get().subjects.map(s => {
      if (s.id === id) {
        updated = { ...s, active, updatedAt: new Date().toISOString() };
        return updated;
      }
      return s;
    });
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    if (updated) firestoreService.saveSubject(updated);
  },

  bulkDeleteSubjects: (ids) => {
    const setIds = new Set(ids);
    const next = get().subjects.filter(s => !setIds.has(s.id));
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    firestoreService.bulkDeleteSubjects(ids);
  },

  bulkImportSubjects: (departmentId, items) => {
    const now = new Date().toISOString();
    const newSubjects: Subject[] = items.map(it => ({
      ...it,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      departmentId,
      active: true,
      createdAt: now,
      updatedAt: now
    }));
    const next = [...get().subjects, ...newSubjects];
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    newSubjects.forEach(s => firestoreService.saveSubject(s));
    return newSubjects.length;
  },

  getActivePeriods: (departmentId?: string) => {
    // Periods are always "active" — disabling was removed. Kept for compatibility.
    return get().periods
      .filter(p => !p.departmentId || p.departmentId === departmentId || p.departmentId === 'GLOBAL')
      .sort((a, b) => a.sequence - b.sequence);
  },

  // Includes disabled periods — needed for historical views/exports so past
  // records for periods that were later disabled remain visible
  getAllDepartmentPeriods: (departmentId?: string) => {
    return get().periods
      .filter(p => !p.departmentId || p.departmentId === departmentId || p.departmentId === 'GLOBAL')
      .sort((a, b) => a.sequence - b.sequence);
  },

  getAllPeriods: () => {
    return [...get().periods].sort((a, b) => a.sequence - b.sequence);
  },

  addPeriod: (periodData) => {
    // Generate a collision-proof id: never reuse an id that already exists
    // (deleting a period must not cause a future add to overwrite old docs)
    const existingIds = new Set(get().periods.map(p => p.id));
    let id = `P${String(get().periods.length + 1).padStart(2, '0')}`;
    while (existingIds.has(id)) {
      id = `P${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    }
    const nextSequence = get().periods.reduce((max, p) => Math.max(max, p.sequence), 0) + 1;
    const newPeriod: Period = {
      ...periodData,
      id,
      sequence: periodData.sequence || nextSequence
    };
    const next = [...get().periods, newPeriod];
    set({ periods: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), periods: next }));
    } catch {}

    firestoreService.savePeriod(newPeriod);
    return newPeriod;
  },

  updatePeriod: (id, updates) => {
    let updated: Period | undefined;
    const next = get().periods.map(p => {
      if (p.id === id) {
        updated = { ...p, ...updates };
        return updated;
      }
      return p;
    });
    set({ periods: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), periods: next }));
    } catch {}

    if (updated) firestoreService.savePeriod(updated);
  },

  // Deletes a period and renumbers the remaining ones (1..n) so they stay
  // aligned. Historical schedules are NEVER modified — the deletion only
  // affects future daily forms and views built from the current period list.
  deletePeriod: (id) => {
    const remaining = get().periods
      .filter(p => p.id !== id)
      .sort((a, b) => a.sequence - b.sequence)
      .map((p, index) => ({ ...p, sequence: index + 1 }));

    set({ periods: remaining });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), periods: remaining }));
    } catch {}

    remaining.forEach(p => firestoreService.savePeriod(p));
  },

  addUser: (userData) => {
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const newUser: KalyaniUser = {
      ...userData,
      uid,
      createdAt: now,
      updatedAt: now
    };
    const next = [...get().users, newUser];
    set({ users: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: next }));
    } catch {}

    firestoreService.saveUser(newUser);
    return newUser;
  },

  updateUser: (uid, updates) => {
    let updated: KalyaniUser | undefined;
    const state = get();
    const currentUserObj = state.users.find(u => u.uid === uid);
    if (!currentUserObj) return;

    let usersToSave: KalyaniUser[] = [];
    const deptId = updates.departmentId || currentUserObj.departmentId;

    const isBecomingHod = updates.role === 'HOD' && updates.hodType !== 'AHOD';
    const isBecomingAhod = updates.hodType === 'AHOD';
    const isDemotingFromHod = updates.role && updates.role !== 'HOD' && currentUserObj.role === 'HOD';
    const isDemotingFromAhod = updates.hodType === null && currentUserObj.hodType === 'AHOD';

    const next = state.users.map(u => {
      if (u.uid === uid) {
        updated = { ...u, ...updates, updatedAt: new Date().toISOString() };
        usersToSave.push(updated);
        return updated;
      }

      // If user is becoming HOD, demote old HOD in that department
      if (isBecomingHod && u.departmentId === deptId && u.role === 'HOD' && u.uid !== uid) {
        const demoted: KalyaniUser = {
          ...u,
          role: 'FACULTY' as UserRole,
          hodType: null,
          designation: u.designation.includes('Head of Department') ? 'Professor' : u.designation,
          updatedAt: new Date().toISOString()
        };
        usersToSave.push(demoted);
        return demoted;
      }

      return u;
    });

    // Also synchronize departments
    let deptToSave: Department | undefined;
    const updatedDepts = state.departments.map(d => {
      if (d.id === deptId) {
        let newDept = { ...d };
        if (isBecomingHod && updated) {
          newDept.hodUid = updated.uid;
          newDept.hodName = updated.name;
          newDept.ahodUids = (newDept.ahodUids || []).filter(id => id !== updated!.uid);
          newDept.ahodNames = (newDept.ahodNames || []).filter(name => name !== updated!.name);
          deptToSave = newDept;
        } else if (isBecomingAhod && updated) {
          const uids = newDept.ahodUids ? [...newDept.ahodUids] : [];
          const names = newDept.ahodNames ? [...newDept.ahodNames] : [];
          if (!uids.includes(updated.uid)) {
            uids.push(updated.uid);
            names.push(updated.name);
          }
          newDept.ahodUids = uids;
          newDept.ahodNames = names;
          newDept.ahodUid = uids[0];
          newDept.ahodName = names[0];
          if (newDept.hodUid === updated.uid) {
            newDept.hodUid = null;
            newDept.hodName = null;
          }
          deptToSave = newDept;
        } else if (isDemotingFromHod && newDept.hodUid === uid) {
          newDept.hodUid = null;
          newDept.hodName = null;
          deptToSave = newDept;
        } else if (isDemotingFromAhod && (newDept.ahodUids?.includes(uid) || newDept.ahodUid === uid)) {
          const uids = (newDept.ahodUids || []).filter(id => id !== uid);
          const names = (newDept.ahodNames || []).filter(name => name !== currentUserObj.name);
          newDept.ahodUids = uids;
          newDept.ahodNames = names;
          newDept.ahodUid = uids[0];
          newDept.ahodName = names[0];
          deptToSave = newDept;
        } else if (updates.name && (newDept.hodUid === uid || newDept.ahodUids?.includes(uid))) {
          if (newDept.hodUid === uid) newDept.hodName = updates.name;
          if (newDept.ahodUids?.includes(uid)) {
            const idx = newDept.ahodUids.indexOf(uid);
            if (idx !== -1 && newDept.ahodNames) newDept.ahodNames[idx] = updates.name;
          }
          deptToSave = newDept;
        }
        return newDept;
      }
      return d;
    });

    // Clear ghost HOD/AHOD pointers in OTHER departments when a user
    // transfers out (e.g. HOD of dept A assigned as HOD of dept B)
    let ghostDeptsToSave: Department[] = [];
    const cleanedDepts = updatedDepts.map(d => {
      if (d.id === deptId) return d;
      const referencesUser = d.hodUid === uid || d.ahodUids?.includes(uid) || d.ahodUid === uid;
      if (!referencesUser) return d;
      const uids = (d.ahodUids || []).filter(id => id !== uid);
      const names = (d.ahodNames || []).filter((_, i) => (d.ahodUids || [])[i] !== uid);
      ghostDeptsToSave.push({
        ...d,
        hodUid: d.hodUid === uid ? null : d.hodUid,
        hodName: d.hodUid === uid ? null : d.hodName,
        ahodUids: uids,
        ahodNames: names,
        ahodUid: uids[0] || null,
        ahodName: names[0] || null
      });
      return ghostDeptsToSave[ghostDeptsToSave.length - 1];
    });

    set({ users: next, departments: cleanedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: next, departments: cleanedDepts }));
    } catch {}

    usersToSave.forEach(u => firestoreService.saveUser(u));
    if (deptToSave) firestoreService.saveDepartment(deptToSave);
    ghostDeptsToSave.forEach(d => firestoreService.saveDepartment(d));
  },

  deleteUser: (uid) => {
    const userToDelete = get().users.find(u => u.uid === uid);
    if (userToDelete?.role === 'ADMIN' || uid === 'usr_admin') {
      console.warn('Security Protection: Cannot delete institutional Administrator account.');
      return;
    }

    const next = get().users.filter(u => u.uid !== uid);
    
    // Also clean up any department referencing this user as HOD or AHOD
    const updatedDepts = get().departments.map(d => {
      let changed = false;
      let newDept = { ...d };
      if (d.hodUid === uid) {
        newDept.hodUid = null;
        newDept.hodName = null;
        changed = true;
      }
      if (d.ahodUids?.includes(uid) || d.ahodUid === uid) {
        const uids = (d.ahodUids || []).filter(id => id !== uid);
        const user = get().users.find(u => u.uid === uid);
        const names = (d.ahodNames || []).filter(name => name !== user?.name);
        newDept.ahodUids = uids;
        newDept.ahodNames = names;
        newDept.ahodUid = uids[0];
        newDept.ahodName = names[0];
        changed = true;
      }
      if (changed) {
        firestoreService.saveDepartment(newDept);
      }
      return newDept;
    });

    set({ users: next, departments: updatedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: next, departments: updatedDepts }));
    } catch {}

    firestoreService.deleteUser(uid);
  },

  bulkImportUsers: (newUserData) => {
    const now = new Date().toISOString();
    const added: KalyaniUser[] = newUserData.map(u => ({
      ...u,
      uid: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      updatedAt: now
    }));
    const next = [...get().users, ...added];
    set({ users: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: next }));
    } catch {}

    added.forEach(u => firestoreService.saveUser(u));
    return added.length;
  },

  assignHod: (departmentId, userUid, type) => {
    const state = get();
    const user = state.users.find((u) => u.uid === userUid);
    if (!user) return;

    let usersToSave: KalyaniUser[] = [];

    // 1. If type is HOD, find previous HOD of this department and demote them to Faculty
    const updatedUsers = state.users.map((u) => {
      if (u.uid === userUid) {
        let updated: KalyaniUser;
        if (type === 'HOD') {
          updated = {
            ...u,
            role: 'HOD' as UserRole,
            hodType: 'HOD',
            departmentId,
            designation: u.designation.includes('Head of Department') ? u.designation : 'Professor & Head of Department',
            updatedAt: new Date().toISOString()
          };
        } else {
          updated = {
            ...u,
            role: 'FACULTY' as UserRole,
            hodType: 'AHOD',
            departmentId,
            designation: 'Assistant HOD',
            updatedAt: new Date().toISOString()
          };
        }
        usersToSave.push(updated);
        return updated;
      }

      // If assigning a new HOD, demote old HOD of this department
      if (type === 'HOD' && u.departmentId === departmentId && u.role === 'HOD' && u.uid !== userUid) {
        const demoted: KalyaniUser = {
          ...u,
          role: 'FACULTY' as UserRole,
          hodType: null,
          designation: u.designation.includes('Head of Department') ? 'Professor' : u.designation,
          updatedAt: new Date().toISOString()
        };
        usersToSave.push(demoted);
        return demoted;
      }

      return u;
    });

    // 2. Update department record
    let updatedDeptObj: Department | undefined;
    const updatedDepts = state.departments.map((d) => {
      if (d.id === departmentId) {
        if (type === 'HOD') {
          updatedDeptObj = {
            ...d,
            hodUid: user.uid,
            hodName: user.name,
            ahodUids: (d.ahodUids || []).filter((id) => id !== user.uid),
            ahodNames: (d.ahodNames || []).filter((name) => name !== user.name)
          };
          return updatedDeptObj;
        } else {
          // Multiple AHODs support
          const currentAhodUids = d.ahodUids ? [...d.ahodUids] : d.ahodUid ? [d.ahodUid] : [];
          const currentAhodNames = d.ahodNames ? [...d.ahodNames] : d.ahodName ? [d.ahodName] : [];

          if (!currentAhodUids.includes(user.uid)) {
            currentAhodUids.push(user.uid);
            currentAhodNames.push(user.name);
          }

          updatedDeptObj = {
            ...d,
            ahodUid: currentAhodUids[0] || user.uid,
            ahodName: currentAhodNames[0] || user.name,
            ahodUids: currentAhodUids,
            ahodNames: currentAhodNames,
          };
          return updatedDeptObj;
        }
      }
      return d;
    });

    set({ users: updatedUsers, departments: updatedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: updatedUsers, departments: updatedDepts }));
    } catch {}

    usersToSave.forEach((u) => firestoreService.saveUser(u));
    if (updatedDeptObj) firestoreService.saveDepartment(updatedDeptObj);

    // Clear ghost HOD/AHOD pointers in the user's PREVIOUS department
    const previousDeptId = user.departmentId;
    if (previousDeptId && previousDeptId !== departmentId) {
      let ghostDept: Department | undefined;
      const cleanedDepts = get().departments.map((d) => {
        if (d.id !== previousDeptId) return d;
        const referencesUser = d.hodUid === userUid || d.ahodUids?.includes(userUid) || d.ahodUid === userUid;
        if (!referencesUser) return d;
        const uids = (d.ahodUids || []).filter((id) => id !== userUid);
        const names = (d.ahodNames || []).filter((name) => name !== user.name);
        ghostDept = {
          ...d,
          hodUid: d.hodUid === userUid ? null : d.hodUid,
          hodName: d.hodUid === userUid ? null : d.hodName,
          ahodUids: uids,
          ahodNames: names,
          ahodUid: uids[0] || null,
          ahodName: names[0] || null
        };
        return ghostDept;
      });
      if (ghostDept) {
        set({ departments: cleanedDepts });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), departments: cleanedDepts }));
        } catch {}
        firestoreService.saveDepartment(ghostDept);
      }
    }
  },

  removeAhod: (departmentId, userUid) => {
    const state = get();
    let updatedUserObj: KalyaniUser | undefined;
    const updatedUsers = state.users.map((u) => {
      if (u.uid === userUid) {
        updatedUserObj = {
          ...u,
          role: 'FACULTY' as UserRole,
          hodType: null,
          designation: 'Associate Professor',
          updatedAt: new Date().toISOString()
        };
        return updatedUserObj;
      }
      return u;
    });

    let updatedDeptObj: Department | undefined;
    const updatedDepts = state.departments.map((d) => {
      if (d.id === departmentId) {
        const uids = (d.ahodUids || (d.ahodUid ? [d.ahodUid] : [])).filter((id) => id !== userUid);
        const removedUser = state.users.find((u) => u.uid === userUid);
        const names = (d.ahodNames || (d.ahodName ? [d.ahodName] : [])).filter(
          (name) => name !== removedUser?.name
        );

        updatedDeptObj = {
          ...d,
          ahodUid: uids[0] || null,
          ahodName: names[0] || null,
          ahodUids: uids,
          ahodNames: names,
        };
        return updatedDeptObj;
      }
      return d;
    });

    set({ users: updatedUsers, departments: updatedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: updatedUsers, departments: updatedDepts }));
    } catch {}

    if (updatedUserObj) firestoreService.saveUser(updatedUserObj);
    if (updatedDeptObj) firestoreService.saveDepartment(updatedDeptObj);
  },

  purgeDatabaseToCleanSlate: () => {
    const adminUser = get().users.find(u => u.role === 'ADMIN') || {
      uid: 'usr_admin',
      name: 'Dr. K. S. Rajan',
      email: 'admin@krce.ac.in',
      departmentId: 'dept_cse',
      departmentName: 'Computer Science & Engineering',
      designation: 'Principal & Chief Administrator',
      role: 'ADMIN' as UserRole,
      hodType: null,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const cleanDepts = get().departments.map(d => ({
      ...d,
      hodUid: null,
      hodName: null,
      ahodUid: null,
      ahodName: null,
      ahodUids: [],
      ahodNames: []
    }));

    set({
      users: [adminUser],
      departments: cleanDepts,
      schedules: {},
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...get(),
        users: [adminUser],
        departments: cleanDepts,
        schedules: {}
      }));
    } catch {}

    firestoreService.purgeDatabaseForProduction();
  },

  getDepartmentConfig: (departmentId: string) => {
    const state = get();
    return state.academicConfigs[departmentId] || {
      departmentId,
      maxAssignedPeriodsPerDay: state.systemSettings.defaultMaxPeriods || 3,
      allowCustomSubjects: true,
      allowFutureEditing: true,
      reminderIntervalMinutes: 30,
      autoLockPastDays: true,
      updatedAt: new Date().toISOString()
    };
  },

  updateDepartmentConfig: (departmentId, updates) => {
    const state = get();
    const current = state.getDepartmentConfig(departmentId);
    const updated: AcademicConfiguration = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const nextConfigs = { ...state.academicConfigs, [departmentId]: updated };
    set({ academicConfigs: nextConfigs });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), academicConfigs: nextConfigs }));
    } catch {}

    firestoreService.saveAcademicConfig(departmentId, updated);
  },

  updateSystemSettings: (updates) => {
    const next = { ...get().systemSettings, ...updates, updatedAt: new Date().toISOString() };
    set({ systemSettings: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), systemSettings: next }));
    } catch {}

    firestoreService.saveSystemSettings(next);
  },

  addDepartment: (deptData) => {
    const id = `dept_${Date.now()}`;
    const newDept: Department = {
      ...deptData,
      id,
      createdAt: new Date().toISOString()
    };
    const next = [...get().departments, newDept];
    set({ departments: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), departments: next }));
    } catch {}

    firestoreService.saveDepartment(newDept);
    return newDept;
  },

  updateDepartment: (id, updates) => {
    let updated: Department | undefined;
    const next = get().departments.map(d => {
      if (d.id === id) {
        updated = { ...d, ...updates };
        return updated;
      }
      return d;
    });
    set({ departments: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), departments: next }));
    } catch {}

    if (updated) firestoreService.saveDepartment(updated);
  }
}));
