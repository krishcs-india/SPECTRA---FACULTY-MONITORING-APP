import { create } from 'zustand';
import { KalyaniUser, UserRole, HodType } from '../types/user';
import { Department } from '../types/department';
import { Period } from '../types/period';
import { Subject } from '../types/subject';
import { FacultySchedule, PeriodEntry, DayAvailabilityOverview, PeriodAvailabilitySummary } from '../types/schedule';
import { SystemSettings } from '../types/configuration';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_PERIODS,
  INITIAL_SETTINGS,
  normalizeDepartmentId,
  createDefaultPeriodsForDepartment
} from '../services/seedDataService';
import { firestoreService } from '../services/firestoreService';
import { isLiveFirebaseConfigured } from '../config/firebase';
import { validateSchedulePeriods } from '../utils/validation';
import {
  getTodayDateString,
  isDateExpiredBeyondRetention,
  isDateWithinRetentionWindow
} from '../utils/dateUtils';
import { notificationService } from '../services/notificationService';

interface AppStoreState {
  users: KalyaniUser[];
  departments: Department[];
  periods: Period[];
  subjects: Subject[];
  schedules: Record<string, FacultySchedule>;
  systemSettings: SystemSettings;
  isInitialized: boolean;
  isCloudHydrated: boolean;

  // Initialization & Reset
  initStore: () => void;
  resetToDefaults: () => void;
  rebuildDatabase: () => Promise<{ success: boolean; error?: string }>;
  clearLocalCache: () => void;

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
  cloneGlobalPeriodsForDepartment: (departmentId: string) => Period[];

  // User Management Actions
  addUser: (user: Omit<KalyaniUser, 'uid' | 'createdAt' | 'updatedAt'>) => KalyaniUser;
  updateUser: (uid: string, updates: Partial<KalyaniUser>) => void;
  deleteUser: (uid: string) => void;
  bulkImportUsers: (newUsers: Omit<KalyaniUser, 'uid' | 'createdAt' | 'updatedAt'>[]) => number;
  assignHod: (departmentId: string, userUid: string, type: 'HOD' | 'AHOD') => void;
  removeAhod: (departmentId: string, userUid: string) => void;

  // System Settings Actions
  updateSystemSettings: (updates: Partial<SystemSettings>) => void;

  // Department Actions
  addDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => Department;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // System & Database Reset Actions
  purgeDatabaseToCleanSlate: () => void;
}

const STORAGE_KEY = 'kalyani_system_storage_v4';

let storeInitStarted = false;

export const useAppStore = create<AppStoreState>((set, get) => ({
  users: [],
  departments: [],
  periods: [],
  subjects: [],
  schedules: {},
  systemSettings: INITIAL_SETTINGS,
  isInitialized: false,
  isCloudHydrated: !isLiveFirebaseConfigured,

  initStore: () => {
    if (storeInitStarted) return;
    storeInitStarted = true;

    const sanitizeUsers = (userList: KalyaniUser[]): KalyaniUser[] => {
      return userList.map((u) => {
        let email = (u.email || '').trim().toLowerCase();
        const rawRole = (u.role || '').toString().toUpperCase().trim();
        const rawHodType = (u.hodType || '').toString().toUpperCase().trim();
        const rawDesig = (u.designation || '').trim();

        let role: UserRole = 'FACULTY';
        let hodType: HodType = null;
        let designation = rawDesig || 'Assistant Professor';

        if (rawRole === 'ADMIN' || u.uid === 'usr_admin') {
          role = 'ADMIN';
          hodType = null;
          designation = 'System Administrator';
        } else if (rawHodType === 'AHOD' || rawDesig.toLowerCase().includes('assistant hod')) {
          role = 'FACULTY';
          hodType = 'AHOD';
          designation = rawDesig || 'Assistant HOD';
        } else if (rawRole === 'HOD' || rawDesig.toLowerCase().includes('head of department')) {
          role = 'HOD';
          hodType = 'HOD';
          designation = rawDesig || 'Professor & Head of Department';
        }

        return {
          ...u,
          email,
          role,
          hodType,
          designation,
          departmentId: (u.departmentId || '').trim().toUpperCase(),
          active: u.active !== false
        };
      });
    };

    const sanitizeSettings = (settings?: Partial<SystemSettings>): SystemSettings => {
      return {
        ...INITIAL_SETTINGS,
        ...(settings || {}),
        collegeName: settings?.collegeName || INITIAL_SETTINGS.collegeName,
        collegeDomain: settings?.collegeDomain || INITIAL_SETTINGS.collegeDomain
      };
    };

    let hasLoadedPeriodsSession = false;

    const persist = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(get()));
      } catch {}
    };

    if (!isLiveFirebaseConfigured) {
      // Local fallback mode
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed) {
          set({
            users: sanitizeUsers(parsed.users || INITIAL_USERS),
            departments: parsed.departments || INITIAL_DEPARTMENTS,
            periods: parsed.periods || INITIAL_PERIODS,
            subjects: parsed.subjects || [],
            schedules: parsed.schedules || {},
            systemSettings: sanitizeSettings(parsed.systemSettings),
            isCloudHydrated: true,
            isInitialized: true
          });
        } else {
          set({
            users: sanitizeUsers(INITIAL_USERS),
            departments: INITIAL_DEPARTMENTS,
            periods: INITIAL_PERIODS,
            subjects: [],
            schedules: {},
            systemSettings: INITIAL_SETTINGS,
            isCloudHydrated: true,
            isInitialized: true
          });
        }
      } catch (e) {
        console.warn('Storage hydration notice:', e);
        set({
          users: sanitizeUsers(INITIAL_USERS),
          departments: INITIAL_DEPARTMENTS,
          periods: INITIAL_PERIODS,
          subjects: [],
          schedules: {},
          systemSettings: INITIAL_SETTINGS,
          isCloudHydrated: true,
          isInitialized: true
        });
      }
    } else {
      // LIVE FIREBASE MODE:
      // Preload local cache first so offline / fast startup has data immediately
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed) {
          set({
            users: sanitizeUsers(parsed.users || INITIAL_USERS),
            departments: parsed.departments || INITIAL_DEPARTMENTS,
            periods: parsed.periods || INITIAL_PERIODS,
            subjects: parsed.subjects || [],
            schedules: parsed.schedules || {},
            systemSettings: sanitizeSettings(parsed.systemSettings),
            isCloudHydrated: false,
            isInitialized: true
          });
        } else {
          set({
            users: INITIAL_USERS,
            departments: INITIAL_DEPARTMENTS,
            periods: INITIAL_PERIODS,
            subjects: [],
            schedules: {},
            systemSettings: INITIAL_SETTINGS,
            isCloudHydrated: false,
            isInitialized: true
          });
        }
      } catch {
        set({
          users: INITIAL_USERS,
          departments: INITIAL_DEPARTMENTS,
          periods: INITIAL_PERIODS,
          subjects: [],
          schedules: {},
          systemSettings: INITIAL_SETTINGS,
          isCloudHydrated: false,
          isInitialized: true
        });
      }
    }

    try {
      import('./useAuthStore').then((m) => m.useAuthStore.getState().refreshActiveUser());
    } catch {}

    // LIVE MODE: Real-time Cloud Firestore synchronization
    if (isLiveFirebaseConfigured) {
      firestoreService.registerSyncHandlers({
        onUsers: (data) => {
          let cleanUsers: KalyaniUser[] = [];
          if (Array.isArray(data) && data.length > 0) {
            cleanUsers = sanitizeUsers(data as KalyaniUser[]);
          } else {
            cleanUsers = INITIAL_USERS;
          }
          const depts = get().departments.length > 0 ? get().departments : INITIAL_DEPARTMENTS;
          // Ensure departmentName is accurately populated
          const enrichedUsers = cleanUsers.map((u) => {
            if (u.role === 'ADMIN') {
              return { ...u, departmentName: 'Institutional Administration' };
            }
            if (u.departmentId) {
              const matchedDept = depts.find((d) => d.id === u.departmentId || d.code === u.departmentId);
              if (matchedDept) {
                return { ...u, departmentName: matchedDept.name };
              }
            }
            return u;
          });

          set({ users: enrichedUsers, isCloudHydrated: true });
          try {
            import('./useAuthStore').then((m) => m.useAuthStore.getState().refreshActiveUser());
          } catch {}
          persist();
        },
        onDepartments: (data) => {
          let depts: Department[] = [];
          if (Array.isArray(data) && data.length > 0) {
            depts = (data as Department[]).map((d) => ({
              ...d,
              id: (d.id || d.code || '').trim().toUpperCase(),
              code: (d.code || d.id || '').trim().toUpperCase(),
              active: d.active !== false
            }));
          } else {
            depts = INITIAL_DEPARTMENTS;
          }
          set({ departments: depts });
          persist();
        },
        onSubjects: (data) => {
          set({ subjects: Array.isArray(data) ? (data as Subject[]) : [] });
          persist();
        },
        onPeriods: (data) => {
          const incoming = Array.isArray(data) && data.length > 0 ? (data as Period[]) : INITIAL_PERIODS;
          const oldPeriods = get().periods;

          let userDept = '';
          let isCurrentHod = false;
          try {
            const authUser = JSON.parse(localStorage.getItem('kalyani_auth_user') || '{}');
            userDept = authUser?.departmentId || '';
            isCurrentHod = authUser?.role === 'HOD' && authUser?.hodType !== 'AHOD';
          } catch {}

          const targetDept = userDept || 'CSE';
          const newDeptPeriods = incoming.filter(
            (p) => (p.departmentId || '').toUpperCase() === targetDept.toUpperCase() && p.active !== false
          );
          const newSignature = newDeptPeriods.map((p) => `${p.id}_${p.name}_${p.sequence}`).sort().join('|');
          const oldDeptPeriods = (oldPeriods || []).filter(
            (p) => (p.departmentId || '').toUpperCase() === targetDept.toUpperCase() && p.active !== false
          );
          const oldSignature = oldDeptPeriods.map((p) => `${p.id}_${p.name}_${p.sequence}`).sort().join('|');

          const knownSigKey = `kalyani_known_period_sig_${targetDept}`;
          const lastKnownSig = localStorage.getItem(knownSigKey);

          // If this is the first load of periods in this app session (app opening):
          // Silently synchronize baseline so opening the app NEVER triggers a false alarm.
          if (!hasLoadedPeriodsSession) {
            hasLoadedPeriodsSession = true;
            try {
              localStorage.setItem(knownSigKey, newSignature);
            } catch {}
            notificationService.syncBackgroundPeriodState(targetDept, newDeptPeriods.length, newSignature);
          } else {
            // Subsequent snapshot in the active session means HOD added, deleted, or updated periods!
            const countChanged = newDeptPeriods.length !== oldDeptPeriods.length;
            const sigChanged = newSignature !== oldSignature && (!lastKnownSig || newSignature !== lastKnownSig);

            if ((countChanged || sigChanged) && newDeptPeriods.length > 0) {
              try {
                localStorage.setItem(knownSigKey, newSignature);
              } catch {}
              notificationService.syncBackgroundPeriodState(targetDept, newDeptPeriods.length, newSignature);

              // Notify faculty/staff in real-time (HOD already sees in-app action feedback)
              if (!isCurrentHod) {
                const msg = countChanged
                  ? `The HOD has updated the periods count to ${newDeptPeriods.length} periods for ${targetDept}. Please review and update your schedule again.`
                  : `The HOD has updated the period schedule for ${targetDept}. Please review and update your schedule again.`;
                notificationService.notifyPeriodUpdated(msg, targetDept);
              }
            }
          }

          set({ periods: incoming, _hasLoadedPeriodsOnce: true } as any);
          persist();
        },
        onSystemSettings: (data) => {
          if (data && typeof data === 'object') {
            set({ systemSettings: sanitizeSettings(data as SystemSettings) });
            persist();
          }
        },
        onSchedules: (data) => {
          if (data && typeof data === 'object') {
            const validSchedules: Record<string, FacultySchedule> = {};
            Object.entries(data).forEach(([key, schedule]) => {
              if (schedule.date && isDateWithinRetentionWindow(schedule.date)) {
                validSchedules[key] = schedule as FacultySchedule;
              }
            });
            set({ schedules: validSchedules });
            persist();
          }
        }
      });

      firestoreService.initRealtimeSync();
    }
  },

  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      periods: INITIAL_PERIODS,
      subjects: [],
      schedules: {},
      systemSettings: INITIAL_SETTINGS,
      isCloudHydrated: true
    });
  },

  rebuildDatabase: async () => {
    const result = await firestoreService.rebuildAndSeedDatabase();
    if (result.success) {
      set({
        users: INITIAL_USERS,
        departments: INITIAL_DEPARTMENTS,
        periods: INITIAL_PERIODS,
        subjects: [],
        schedules: {},
        systemSettings: INITIAL_SETTINGS,
        isCloudHydrated: true
      });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(get()));
      } catch {}
      try {
        import('./useAuthStore').then((m) => m.useAuthStore.getState().refreshActiveUser());
      } catch {}
    }
    return result;
  },

  clearLocalCache: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      periods: INITIAL_PERIODS,
      subjects: [],
      schedules: {},
      isCloudHydrated: false,
      isInitialized: true
    });
  },

  getSchedule: (facultyId: string, date: string) => {
    const key = `${facultyId}_${date}`;
    return get().schedules[key] || null;
  },

  submitSchedule: (facultyId: string, date: string, periods: Record<string, PeriodEntry>) => {
    const state = get();
    const faculty = state.users.find((u) => u.uid === facultyId);
    if (!faculty) {
      return { success: false, error: 'Faculty record not found' };
    }

    if (isDateExpiredBeyondRetention(date)) {
      return { success: false, error: 'Schedules older than 6 days are expired and cannot be modified.' };
    }

    const validation = validateSchedulePeriods(periods);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const hasAssignedPeriods = Object.values(periods).some(
      (p) => p && (p.type === 'SUBJECT' || p.type === 'CUSTOM')
    );
    const calculatedStatus: FacultySchedule['status'] = hasAssignedPeriods ? 'SUBMITTED' : 'FULL_DAY_FREE';

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
      status: calculatedStatus,
      periods,
      submittedAt: now,
      updatedAt: now
    };

    const nextSchedules = { ...state.schedules, [key]: newSchedule };
    set({ schedules: nextSchedules });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), schedules: nextSchedules }));
    } catch {}

    // Real-time Cloud Firestore sync
    firestoreService.saveSchedule(newSchedule);

    return { success: true };
  },

  submitFullDayFree: (facultyId: string, date: string) => {
    const state = get();
    const faculty = state.users.find((u) => u.uid === facultyId);
    if (!faculty) {
      return { success: false, error: 'Faculty record not found' };
    }

    if (isDateExpiredBeyondRetention(date)) {
      return { success: false, error: 'Schedules older than 6 days are expired and cannot be modified.' };
    }

    const activePeriods = state.getActivePeriods(faculty.departmentId);
    const freePeriods: Record<string, PeriodEntry> = {};
    activePeriods.forEach((p) => {
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

    // Real-time Cloud Firestore sync
    firestoreService.saveSchedule(newSchedule);

    return { success: true };
  },

  getDepartmentAvailability: (departmentId: string, date: string): DayAvailabilityOverview => {
    const state = get();
    const cleanDept = normalizeDepartmentId(departmentId);

    // HOD monitors faculty and AHODs in their department. Main HOD never appears in staff list.
    const deptFaculty = state.users.filter((u) => {
      if (normalizeDepartmentId(u.departmentId) !== cleanDept || !u.active || u.role === 'ADMIN') return false;
      const isMainHod = (u.role === 'HOD' || (u.designation || '').toLowerCase().includes('head of department')) && u.hodType !== 'AHOD';
      return !isMainHod;
    });
    const activePeriods = state.getActivePeriods(cleanDept);

    let submittedCount = 0;
    let fullDayFreeCount = 0;
    let notSubmittedCount = 0;

    const facultyStatuses = deptFaculty.map((faculty) => {
      const key = `${faculty.uid}_${date}`;
      let schedule: FacultySchedule | undefined = state.schedules[key];
      if (!schedule && faculty.email) {
        const cleanEmail = faculty.email.toLowerCase().trim();
        schedule = Object.values(state.schedules).find(
          (s) => (s.facultyEmail || '').toLowerCase().trim() === cleanEmail && s.date === date
        );
      }

      let status: FacultySchedule['status'] = 'NOT_SUBMITTED';
      let assignedCount = 0;

      if (schedule) {
        const periodsAssigned = Object.values(schedule.periods || {}).filter(
          (p) => p && p.type !== 'FREE'
        ).length;

        // If explicitly FULL_DAY_FREE or submitted with 0 assigned periods -> strictly FULL_DAY_FREE
        if (schedule.status === 'FULL_DAY_FREE' || (schedule.status === 'SUBMITTED' && periodsAssigned === 0)) {
          status = 'FULL_DAY_FREE';
          fullDayFreeCount++;
          assignedCount = 0;
        } else if (schedule.status === 'SUBMITTED') {
          status = 'SUBMITTED';
          submittedCount++;
          assignedCount = periodsAssigned;
        } else {
          status = schedule.status;
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
    const periodAvailability: PeriodAvailabilitySummary[] = activePeriods.map((period) => {
      const freeFaculty: PeriodAvailabilitySummary['freeFaculty'] = [];
      const busyFaculty: PeriodAvailabilitySummary['busyFaculty'] = [];

      deptFaculty.forEach((faculty) => {
        const key = `${faculty.uid}_${date}`;
        let schedule: FacultySchedule | undefined = state.schedules[key];
        if (!schedule && faculty.email) {
          const cleanEmail = faculty.email.toLowerCase().trim();
          schedule = Object.values(state.schedules).find(
            (s) => (s.facultyEmail || '').toLowerCase().trim() === cleanEmail && s.date === date
          );
        }

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

        const entry = schedule.periods?.[period.id];
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
      .filter((s) => s.facultyId === facultyId && isDateWithinRetentionWindow(s.date))
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  getDepartmentSubjects: (departmentId: string) => {
    const state = get();
    const cleanDept = normalizeDepartmentId(departmentId);
    return state.subjects
      .filter((s) => {
        if (!s || s.active === false) return false;
        const sDept = normalizeDepartmentId(s.departmentId);
        return !s.departmentId || s.departmentId === 'GLOBAL' || sDept === cleanDept;
      })
      .sort((a, b) => (a.subjectCode || '').localeCompare(b.subjectCode || ''));
  },

  addSubject: (subjectData) => {
    const cleanDept = normalizeDepartmentId(subjectData.departmentId);
    const cleanCode = (subjectData.subjectCode || '').trim().toUpperCase();
    const cleanName = (subjectData.subjectName || '').trim();
    const safeCodeStr = cleanCode.replace(/[^A-Z0-9]/g, '_');
    const safeNameStr = cleanName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
    const id = safeCodeStr
      ? `sub_${cleanDept.toLowerCase()}_${safeCodeStr.toLowerCase()}_${safeNameStr}`
      : `sub_${cleanDept.toLowerCase()}_${safeNameStr || Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newSubject: Subject = {
      ...subjectData,
      subjectCode: cleanCode,
      subjectName: cleanName,
      departmentId: cleanDept,
      id,
      active: subjectData.active !== false,
      createdAt: now,
      updatedAt: now
    };

    const currentSubjects = [...get().subjects];
    const existingIdx = currentSubjects.findIndex((s) => s.id === id);
    if (existingIdx >= 0) {
      currentSubjects[existingIdx] = newSubject;
    } else {
      currentSubjects.push(newSubject);
    }

    set({ subjects: currentSubjects });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: currentSubjects }));
    } catch {}

    firestoreService.saveSubject(newSubject);
    return newSubject;
  },

  updateSubject: (id, updates) => {
    let updated: Subject | undefined;
    const next = get().subjects.map((s) => {
      if (s.id === id) {
        const cleanCode = updates.subjectCode !== undefined ? (updates.subjectCode || '').trim().toUpperCase() : s.subjectCode;
        updated = {
          ...s,
          ...updates,
          subjectCode: cleanCode,
          ...(updates.subjectName ? { subjectName: updates.subjectName.trim() } : {}),
          ...(updates.departmentId ? { departmentId: normalizeDepartmentId(updates.departmentId) } : {}),
          updatedAt: new Date().toISOString()
        };
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
    const next = get().subjects.filter((s) => s.id !== id);
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    firestoreService.deleteSubject(id);
  },

  toggleSubjectActive: (id, active) => {
    let updated: Subject | undefined;
    const next = get().subjects.map((s) => {
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
    const next = get().subjects.filter((s) => !setIds.has(s.id));
    set({ subjects: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: next }));
    } catch {}

    firestoreService.bulkDeleteSubjects(ids);
  },

  bulkImportSubjects: (departmentId, items) => {
    const cleanDept = normalizeDepartmentId(departmentId);
    const now = new Date().toISOString();
    const newSubjects: Subject[] = items.map((it) => {
      const cleanCode = (it.subjectCode || '').trim().toUpperCase();
      const cleanName = (it.subjectName || '').trim();
      const safeCodeStr = cleanCode.replace(/[^A-Z0-9]/g, '_');
      const safeNameStr = cleanName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().slice(0, 30);
      const id = safeCodeStr
        ? `sub_${cleanDept.toLowerCase()}_${safeCodeStr.toLowerCase()}_${safeNameStr}`
        : `sub_${cleanDept.toLowerCase()}_${safeNameStr || Date.now().toString(36)}`;
      return {
        ...it,
        subjectCode: cleanCode,
        subjectName: cleanName,
        id,
        departmentId: cleanDept,
        active: true,
        createdAt: now,
        updatedAt: now
      };
    });

    const currentSubjects = [...get().subjects];
    newSubjects.forEach((newSub) => {
      const existingIdx = currentSubjects.findIndex((s) => s.id === newSub.id);
      if (existingIdx >= 0) {
        currentSubjects[existingIdx] = newSub;
      } else {
        currentSubjects.push(newSub);
      }
    });

    set({ subjects: currentSubjects });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), subjects: currentSubjects }));
    } catch {}

    newSubjects.forEach((s) => firestoreService.saveSubject(s));
    return newSubjects.length;
  },

  getActivePeriods: (departmentId?: string) => {
    const all = get().periods;
    const cleanDept = normalizeDepartmentId(departmentId) || 'CSE';
    const deptPeriods = all.filter(
      (p) => normalizeDepartmentId(p.departmentId) === cleanDept && p.active !== false
    );
    if (deptPeriods.length > 0) {
      return deptPeriods.sort((a, b) => a.sequence - b.sequence);
    }
    return createDefaultPeriodsForDepartment(cleanDept);
  },

  getAllDepartmentPeriods: (departmentId?: string) => {
    const all = get().periods;
    const cleanDept = normalizeDepartmentId(departmentId) || 'CSE';
    const deptPeriods = all.filter(
      (p) => normalizeDepartmentId(p.departmentId) === cleanDept
    );
    if (deptPeriods.length > 0) {
      return deptPeriods.sort((a, b) => a.sequence - b.sequence);
    }
    return createDefaultPeriodsForDepartment(cleanDept);
  },

  getAllPeriods: () => {
    return [...get().periods].sort((a, b) => a.sequence - b.sequence);
  },

  addPeriod: (periodData) => {
    const cleanDept = normalizeDepartmentId(periodData.departmentId) || 'CSE';
    const deptPeriods = get().periods.filter((p) => normalizeDepartmentId(p.departmentId) === cleanDept);
    const nextSequence = periodData.sequence || (deptPeriods.reduce((max, p) => Math.max(max, p.sequence), 0) + 1);
    const id = `P_${cleanDept}_${nextSequence}`;
    const newPeriod: Period = {
      ...periodData,
      departmentId: cleanDept,
      id,
      sequence: nextSequence,
      name: periodData.name || `Period ${nextSequence}`,
      shortName: periodData.shortName || `Period ${nextSequence}`,
      active: true
    };
    const nextPeriods = [...get().periods.filter((p) => p.id !== id), newPeriod];

    // Period count changed: invalidate TODAY'S schedules for this department so faculties are notified to resubmit
    const today = getTodayDateString();
    const nextSchedules = { ...get().schedules };
    let schedulesChanged = false;

    Object.keys(nextSchedules).forEach((key) => {
      const s = nextSchedules[key];
      if (normalizeDepartmentId(s.departmentId) === cleanDept && s.date === today) {
        delete nextSchedules[key];
        schedulesChanged = true;
      }
    });

    set({ periods: nextPeriods, ...(schedulesChanged ? { schedules: nextSchedules } : {}) });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), periods: nextPeriods, ...(schedulesChanged ? { schedules: nextSchedules } : {}) }));
    } catch {}

    const newDeptPeriods = nextPeriods.filter((p) => normalizeDepartmentId(p.departmentId) === cleanDept && p.active !== false);
    const newSig = newDeptPeriods.map((p) => `${p.id}_${p.name}_${p.sequence}`).sort().join('|');
    try {
      localStorage.setItem(`kalyani_known_period_sig_${cleanDept}`, newSig);
    } catch {}
    notificationService.syncBackgroundPeriodState(cleanDept, newDeptPeriods.length, newSig);

    firestoreService.savePeriod(newPeriod);
    if (schedulesChanged) {
      firestoreService.deleteTodaySchedulesForDepartment(cleanDept, today);
    }
    return newPeriod;
  },

  updatePeriod: (id, updates) => {
    let updated: Period | undefined;
    const next = get().periods.map((p) => {
      if (p.id === id) {
        updated = {
          ...p,
          ...updates,
          ...(updates.departmentId ? { departmentId: normalizeDepartmentId(updates.departmentId) } : {})
        };
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

  deletePeriod: (id) => {
    const all = get().periods;
    const removed = all.find((p) => p.id === id);
    if (!removed) return;
    const cleanDept = normalizeDepartmentId(removed.departmentId) || 'CSE';
    const oldDeptPeriods = all.filter((p) => normalizeDepartmentId(p.departmentId) === cleanDept);

    // Renumber only the remaining periods of this department with sequential names & canonical IDs: P_${cleanDept}_1...
    const remaining = all
      .filter((p) => p.id !== id && normalizeDepartmentId(p.departmentId) === cleanDept)
      .sort((a, b) => a.sequence - b.sequence)
      .map((p, index) => {
        const seq = index + 1;
        return {
          ...p,
          id: `P_${cleanDept}_${seq}`,
          departmentId: cleanDept,
          sequence: seq,
          name: `Period ${seq}`,
          shortName: `Period ${seq}`
        };
      });

    const otherDeptsPeriods = all.filter((p) => normalizeDepartmentId(p.departmentId) !== cleanDept);
    const nextPeriods = [...otherDeptsPeriods, ...remaining];

    // Period count changed: invalidate TODAY'S schedules for this department so faculties are notified to resubmit
    const today = getTodayDateString();
    const nextSchedules = { ...get().schedules };
    let schedulesChanged = false;

    Object.keys(nextSchedules).forEach((key) => {
      const s = nextSchedules[key];
      if (normalizeDepartmentId(s.departmentId) === cleanDept && s.date === today) {
        delete nextSchedules[key];
        schedulesChanged = true;
      }
    });

    set({ periods: nextPeriods, ...(schedulesChanged ? { schedules: nextSchedules } : {}) });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), periods: nextPeriods, ...(schedulesChanged ? { schedules: nextSchedules } : {}) }));
    } catch {}

    // Calculate all IDs that must be deleted from Firestore to prevent orphaned ghost periods
    const remainingIdSet = new Set(remaining.map((p) => p.id));
    const idsToDelete = new Set<string>();
    idsToDelete.add(removed.id);
    idsToDelete.add(id);
    oldDeptPeriods.forEach((p) => {
      if (!remainingIdSet.has(p.id)) {
        idsToDelete.add(p.id);
      }
    });
    // Ensure any trailing period index up to oldDeptPeriods.length + 5 is completely purged
    for (let s = remaining.length + 1; s <= oldDeptPeriods.length + 5; s++) {
      idsToDelete.add(`P_${cleanDept}_${s}`);
    }

    const newSig = remaining.map((p) => `${p.id}_${p.name}_${p.sequence}`).sort().join('|');
    try {
      localStorage.setItem(`kalyani_known_period_sig_${cleanDept}`, newSig);
    } catch {}
    notificationService.syncBackgroundPeriodState(cleanDept, remaining.length, newSig);

    firestoreService.deletePeriodsBatch(Array.from(idsToDelete));
    if (remaining.length > 0) {
      firestoreService.savePeriodsBatch(remaining);
    }
    if (schedulesChanged) {
      firestoreService.deleteTodaySchedulesForDepartment(cleanDept, today);
    }
  },

  cloneGlobalPeriodsForDepartment: (departmentId: string): Period[] => {
    const state = get();
    const cleanDept = normalizeDepartmentId(departmentId) || 'CSE';
    const existing = state.periods.filter((p) => normalizeDepartmentId(p.departmentId) === cleanDept);
    if (existing.length > 0) return existing;

    const initial = createDefaultPeriodsForDepartment(cleanDept);
    const next = [...state.periods, ...initial];
    set({ periods: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), periods: next }));
    } catch {}
    initial.forEach((p: Period) => firestoreService.savePeriod(p));
    return initial;
  },

  addUser: (userData) => {
    const uid = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();
    const state = get();
    const cleanEmail = userData.email.trim().toLowerCase();
    const cleanDept = normalizeDepartmentId(userData.departmentId);
    const resolvedDeptName = userData.departmentName || state.departments.find((d) => d.id === cleanDept || d.code === cleanDept)?.name || 'General Faculty';

    const newUser: KalyaniUser = {
      ...userData,
      departmentId: cleanDept,
      email: cleanEmail,
      departmentName: resolvedDeptName,
      uid,
      createdAt: now,
      updatedAt: now
    };

    const isHod = userData.role === 'HOD' && userData.hodType !== 'AHOD';
    const isAhod = userData.hodType === 'AHOD';

    let usersToSave: KalyaniUser[] = [newUser];
    let nextUsers = state.users.map((u) => {
      // If newly added user is HOD, existing HOD becomes regular FACULTY safely
      if (isHod && normalizeDepartmentId(u.departmentId) === cleanDept && u.role === 'HOD' && u.hodType !== 'AHOD') {
        const demoted: KalyaniUser = {
          ...u,
          role: 'FACULTY',
          hodType: null,
          updatedAt: now
        };
        usersToSave.push(demoted);
        return demoted;
      }
      return u;
    });
    nextUsers.push(newUser);

    // Update department leadership records
    let deptToSave: Department | undefined;
    const nextDepts = state.departments.map((d) => {
      if (d.id === cleanDept || d.code === cleanDept) {
        let newDept = { ...d };
        if (isHod) {
          newDept.hodUid = newUser.uid;
          newDept.hodName = newUser.name;
          newDept.ahodUids = (newDept.ahodUids || []).filter((id) => id !== newUser.uid);
          newDept.ahodNames = (newDept.ahodNames || []).filter((name) => name !== newUser.name);
          deptToSave = newDept;
        } else if (isAhod) {
          const uids = newDept.ahodUids ? [...newDept.ahodUids] : [];
          const names = newDept.ahodNames ? [...newDept.ahodNames] : [];
          if (!uids.includes(newUser.uid)) {
            uids.push(newUser.uid);
            names.push(newUser.name);
          }
          newDept.ahodUids = uids;
          newDept.ahodNames = names;
          newDept.ahodUid = uids[0];
          newDept.ahodName = names[0];
          if (newDept.hodUid === newUser.uid) {
            newDept.hodUid = null;
            newDept.hodName = null;
          }
          deptToSave = newDept;
        }
        return newDept;
      }
      return d;
    });

    set({ users: nextUsers, departments: nextDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: nextUsers, departments: nextDepts }));
    } catch {}

    usersToSave.forEach((u) => firestoreService.saveUser(u));
    if (deptToSave) firestoreService.saveDepartment(deptToSave);

    return newUser;
  },

  updateUser: (uid, updates) => {
    let updated: KalyaniUser | undefined;
    const state = get();
    const currentUserObj = state.users.find((u) => u.uid === uid);
    if (!currentUserObj) return;

    let usersToSave: KalyaniUser[] = [];
    const rawDept = updates.departmentId !== undefined ? updates.departmentId : currentUserObj.departmentId;
    const deptId = normalizeDepartmentId(rawDept);
    const resolvedDeptName = updates.departmentName || (deptId ? state.departments.find((d) => d.id === deptId || d.code === deptId)?.name : currentUserObj.departmentName);

    const isBecomingHod = updates.role === 'HOD' && updates.hodType !== 'AHOD';
    const isBecomingAhod = updates.hodType === 'AHOD';
    const isDemotingFromHod = updates.role && updates.role !== 'HOD' && currentUserObj.role === 'HOD';
    const isDemotingFromAhod = updates.hodType === null && currentUserObj.hodType === 'AHOD';

    const now = new Date().toISOString();
    const normalizedUpdates = {
      ...updates,
      departmentId: deptId,
      ...(updates.email ? { email: updates.email.trim().toLowerCase() } : {}),
      departmentName: resolvedDeptName
    };

    let next = state.users.map((u) => {
      if (u.uid === uid) {
        updated = { ...u, ...normalizedUpdates, updatedAt: now };
        usersToSave.push(updated);
        return updated;
      }
      // If user is becoming HOD, other HOD in same department safely becomes regular FACULTY
      if (isBecomingHod && normalizeDepartmentId(u.departmentId) === deptId && u.role === 'HOD' && u.uid !== uid) {
        const demoted: KalyaniUser = { ...u, role: 'FACULTY', hodType: null, updatedAt: now };
        usersToSave.push(demoted);
        return demoted;
      }
      return u;
    });

    // Synchronize departments
    let deptToSave: Department | undefined;
    const updatedDepts = state.departments.map((d) => {
      if (d.id === deptId || d.code === deptId) {
        let newDept = { ...d };
        if (isBecomingHod && updated) {
          newDept.hodUid = updated.uid;
          newDept.hodName = updated.name;
          newDept.ahodUids = (newDept.ahodUids || []).filter((id) => id !== updated!.uid);
          newDept.ahodNames = (newDept.ahodNames || []).filter((name) => name !== updated!.name);
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
          const uids = (newDept.ahodUids || []).filter((id) => id !== uid);
          const names = (newDept.ahodNames || []).filter((name) => name !== currentUserObj.name);
          newDept.ahodUids = uids;
          newDept.ahodNames = names;
          newDept.ahodUid = uids[0] || null;
          newDept.ahodName = names[0] || null;
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

    // Clear ghost HOD/AHOD pointers in other departments
    let ghostDeptsToSave: Department[] = [];
    const cleanedDepts = updatedDepts.map((d) => {
      if (d.id === deptId || d.code === deptId) return d;
      const referencesUser = d.hodUid === uid || d.ahodUids?.includes(uid) || d.ahodUid === uid;
      if (!referencesUser) return d;
      const uids = (d.ahodUids || []).filter((id) => id !== uid);
      const names = (d.ahodNames || []).filter((_, i) => (d.ahodUids || [])[i] !== uid);
      const ghostDept = {
        ...d,
        hodUid: d.hodUid === uid ? null : d.hodUid,
        hodName: d.hodUid === uid ? null : d.hodName,
        ahodUids: uids,
        ahodNames: names,
        ahodUid: uids[0] || null,
        ahodName: names[0] || null
      };
      ghostDeptsToSave.push(ghostDept);
      return ghostDept;
    });

    set({ users: next, departments: cleanedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: next, departments: cleanedDepts }));
    } catch {}

    usersToSave.forEach((u) => firestoreService.saveUser(u));
    if (deptToSave) firestoreService.saveDepartment(deptToSave);
    ghostDeptsToSave.forEach((d) => firestoreService.saveDepartment(d));
  },

  deleteUser: (uid) => {
    const userToDelete = get().users.find((u) => u.uid === uid);
    if (userToDelete?.role === 'ADMIN' || uid === 'usr_admin') {
      console.warn('Security Protection: Cannot delete institutional Administrator account.');
      return;
    }

    const next = get().users.filter((u) => u.uid !== uid);

    // Clean up schedules belonging to this user
    const nextSchedules = { ...get().schedules };
    Object.keys(nextSchedules).forEach((k) => {
      if (nextSchedules[k].facultyId === uid || k.startsWith(`${uid}_`)) {
        delete nextSchedules[k];
      }
    });

    // Clean up department leadership references
    const updatedDepts = get().departments.map((d) => {
      let changed = false;
      let newDept = { ...d };
      if (d.hodUid === uid) {
        newDept.hodUid = null;
        newDept.hodName = null;
        changed = true;
      }
      if (d.ahodUids?.includes(uid) || d.ahodUid === uid) {
        const uids = (d.ahodUids || []).filter((id) => id !== uid);
        const user = get().users.find((u) => u.uid === uid);
        const names = (d.ahodNames || []).filter((name) => name !== user?.name);
        newDept.ahodUids = uids;
        newDept.ahodNames = names;
        newDept.ahodUid = uids[0] || null;
        newDept.ahodName = names[0] || null;
        changed = true;
      }
      if (changed) {
        firestoreService.saveDepartment(newDept);
      }
      return newDept;
    });

    set({ users: next, departments: updatedDepts, schedules: nextSchedules });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: next, departments: updatedDepts, schedules: nextSchedules }));
    } catch {}

    firestoreService.deleteUser(uid);
    firestoreService.deleteSchedulesForUser(uid);
  },

  bulkImportUsers: (newUserData) => {
    const now = new Date().toISOString();
    const added: KalyaniUser[] = newUserData.map((u) => ({
      ...u,
      departmentId: normalizeDepartmentId(u.departmentId),
      uid: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      updatedAt: now
    }));

    const state = get();
    let updatedUsers = [...state.users];
    let updatedDepts = [...state.departments];
    let deptsToSave: Department[] = [];

    added.forEach((newUser) => {
      const deptId = newUser.departmentId;
      const isHod = newUser.role === 'HOD' && newUser.hodType !== 'AHOD';
      const isAhod = newUser.hodType === 'AHOD';

      if (isHod) {
        updatedUsers = updatedUsers.map((u) => {
          if (normalizeDepartmentId(u.departmentId) === deptId && u.role === 'HOD' && u.hodType !== 'AHOD' && u.uid !== newUser.uid) {
            const demoted: KalyaniUser = { ...u, role: 'FACULTY', hodType: null, updatedAt: now };
            firestoreService.saveUser(demoted);
            return demoted;
          }
          return u;
        });

        updatedDepts = updatedDepts.map((d) => {
          if (d.id === deptId || d.code === deptId) {
            const newDept = {
              ...d,
              hodUid: newUser.uid,
              hodName: newUser.name,
              ahodUids: (d.ahodUids || []).filter((id) => id !== newUser.uid),
              ahodNames: (d.ahodNames || []).filter((name) => name !== newUser.name)
            };
            deptsToSave.push(newDept);
            return newDept;
          }
          return d;
        });
      } else if (isAhod) {
        updatedDepts = updatedDepts.map((d) => {
          if (d.id === deptId || d.code === deptId) {
            const uids = d.ahodUids ? [...d.ahodUids] : [];
            const names = d.ahodNames ? [...d.ahodNames] : [];
            if (!uids.includes(newUser.uid)) {
              uids.push(newUser.uid);
              names.push(newUser.name);
            }
            const newDept = {
              ...d,
              ahodUids: uids,
              ahodNames: names,
              ahodUid: uids[0],
              ahodName: names[0]
            };
            deptsToSave.push(newDept);
            return newDept;
          }
          return d;
        });
      }

      updatedUsers.push(newUser);
      firestoreService.saveUser(newUser);
    });

    set({ users: updatedUsers, departments: updatedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: updatedUsers, departments: updatedDepts }));
    } catch {}

    deptsToSave.forEach((d) => firestoreService.saveDepartment(d));
    return added.length;
  },

  assignHod: (departmentId, userUid, type) => {
    const state = get();
    const cleanDept = normalizeDepartmentId(departmentId);
    const user = state.users.find((u) => u.uid === userUid);
    if (!user) return;

    let usersToSave: KalyaniUser[] = [];
    const now = new Date().toISOString();
    let updatedUsers = state.users.map((u) => {
      if (type === 'HOD' && normalizeDepartmentId(u.departmentId) === cleanDept && u.role === 'HOD' && u.uid !== userUid) {
        const demoted: KalyaniUser = { ...u, role: 'FACULTY', hodType: null, updatedAt: now };
        usersToSave.push(demoted);
        return demoted;
      }
      if (u.uid === userUid) {
        let updated: KalyaniUser;
        if (type === 'HOD') {
          updated = {
            ...u,
            role: 'HOD' as UserRole,
            hodType: 'HOD',
            departmentId: cleanDept,
            designation: u.designation.includes('Head of Department') ? u.designation : 'Professor & Head of Department',
            updatedAt: now
          };
        } else {
          updated = {
            ...u,
            role: 'FACULTY' as UserRole,
            hodType: 'AHOD',
            departmentId: cleanDept,
            designation: 'Assistant HOD',
            updatedAt: now
          };
        }
        usersToSave.push(updated);
        return updated;
      }
      return u;
    });

    let deptToSave: Department | undefined;
    const updatedDepts = state.departments.map((d) => {
      if (d.id === cleanDept || d.code === cleanDept) {
        let newDept = { ...d };
        if (type === 'HOD') {
          newDept.hodUid = user.uid;
          newDept.hodName = user.name;
          newDept.ahodUids = (newDept.ahodUids || []).filter((id) => id !== userUid);
          newDept.ahodNames = (newDept.ahodNames || []).filter((name) => name !== user.name);
        } else {
          const uids = newDept.ahodUids ? [...newDept.ahodUids] : [];
          const names = newDept.ahodNames ? [...newDept.ahodNames] : [];
          if (!uids.includes(userUid)) {
            uids.push(userUid);
            names.push(user.name);
          }
          newDept.ahodUids = uids;
          newDept.ahodNames = names;
          newDept.ahodUid = uids[0];
          newDept.ahodName = names[0];
          if (newDept.hodUid === userUid) {
            newDept.hodUid = null;
            newDept.hodName = null;
          }
        }
        deptToSave = newDept;
        return newDept;
      }
      return d;
    });

    let ghostDept: Department | undefined;
    const cleanedDepts = updatedDepts.map((d) => {
      if (d.id === cleanDept || d.code === cleanDept) return d;
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

    set({ users: updatedUsers, departments: cleanedDepts });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), users: updatedUsers, departments: cleanedDepts }));
    } catch {}

    usersToSave.forEach((u) => firestoreService.saveUser(u));
    if (deptToSave) firestoreService.saveDepartment(deptToSave);
    if (ghostDept) firestoreService.saveDepartment(ghostDept);
  },

  removeAhod: (departmentId, userUid) => {
    const state = get();
    const cleanDept = normalizeDepartmentId(departmentId);
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
      if (d.id === cleanDept || d.code === cleanDept) {
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
    const adminUser = get().users.find((u) => u.role === 'ADMIN') || INITIAL_USERS[0];

    const cleanDepts = get().departments.map((d) => ({
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
      subjects: [],
      periods: INITIAL_PERIODS
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...get(),
        users: [adminUser],
        departments: cleanDepts,
        schedules: {},
        subjects: [],
        periods: INITIAL_PERIODS
      }));
    } catch {}

    firestoreService.purgeDatabaseForProduction();
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
    const cleanCode = (deptData.code || '').trim().toUpperCase();
    const newDept: Department = {
      ...deptData,
      id: cleanCode,
      code: cleanCode,
      name: deptData.name.trim(),
      active: deptData.active !== false,
      hodUid: null,
      hodName: null,
      ahodUid: null,
      ahodName: null,
      ahodUids: [],
      ahodNames: [],
      createdAt: new Date().toISOString()
    };
    const next = [...get().departments.filter((d) => d.id !== cleanCode), newDept];
    set({ departments: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), departments: next }));
    } catch {}

    firestoreService.saveDepartment(newDept);
    return newDept;
  },

  updateDepartment: (id, updates) => {
    let updated: Department | undefined;
    const next = get().departments.map((d) => {
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
  },

  deleteDepartment: (id) => {
    const cleanId = (id || '').trim().toUpperCase();
    const next = get().departments.filter((d) => d.id !== cleanId && d.code !== cleanId);
    set({ departments: next });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...get(), departments: next }));
    } catch {}

    firestoreService.deleteDepartment(cleanId);
  }
}));
