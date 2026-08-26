import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db, isLiveFirebaseConfigured } from '../config/firebase';
import { FacultySchedule } from '../types/schedule';
import { KalyaniUser } from '../types/user';
import { Department } from '../types/department';
import { Subject } from '../types/subject';
import { Period } from '../types/period';
import { AcademicConfiguration, SystemSettings } from '../types/configuration';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_PERIODS,
  INITIAL_SUBJECTS,
  INITIAL_CONFIGS,
  INITIAL_SETTINGS
} from './seedDataService';

// Track whether each collection has delivered data at least once, so an
// initial empty snapshot doesn't wipe local state, but real deletions propagate
const listenerHasData: Record<string, boolean> = {};

export const firestoreService = {
  /**
   * Converts undefined values to null so Firestore setDoc never throws
   * "Unsupported field value: undefined"
   */
  sanitizeForFirestore<T>(value: T): T {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
      return value.map((item) => firestoreService.sanitizeForFirestore(item)) as unknown as T;
    }
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = val === undefined ? null : firestoreService.sanitizeForFirestore(val);
    }
    return out as T;
  },

  /**
   * Initializes Firestore with seed collections if currently empty
   */
  async ensureDatabaseInitialized(): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;

    try {
      // Check if users collection exists
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        console.log('⚡ Initializing Firestore with default institutional master records...');
        const batch = writeBatch(db);

        // Seed Users
        INITIAL_USERS.forEach((u) => {
          const ref = doc(db, 'users', u.uid);
          batch.set(ref, u);
        });

        // Seed Departments
        INITIAL_DEPARTMENTS.forEach((d) => {
          const ref = doc(db, 'departments', d.id);
          batch.set(ref, d);
        });

        // Seed Periods
        INITIAL_PERIODS.forEach((p) => {
          const ref = doc(db, 'periods', p.id);
          batch.set(ref, p);
        });

        // Seed Subjects
        INITIAL_SUBJECTS.forEach((s) => {
          const ref = doc(db, 'subjects', s.id);
          batch.set(ref, s);
        });

        // Seed Academic Configs
        Object.entries(INITIAL_CONFIGS).forEach(([deptId, cfg]) => {
          const ref = doc(db, 'academic_configs', deptId);
          batch.set(ref, cfg);
        });

        // Seed System Settings
        const settingsRef = doc(db, 'settings', 'global');
        batch.set(settingsRef, INITIAL_SETTINGS);

        await batch.commit();
        console.log('✅ Firestore institutional database initialized successfully.');
      }
    } catch (err) {
      console.warn('Firestore initialization notice (check security rules if needed):', err);
    }
  },

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================

  subscribeSchedules(onUpdate: (schedules: Record<string, FacultySchedule>) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(collection(db, 'schedules'), (snapshot) => {
        const schedules: Record<string, FacultySchedule> = {};
        snapshot.forEach((docSnap) => {
          schedules[docSnap.id] = docSnap.data() as FacultySchedule;
        });
        onUpdate(schedules);
      }, (err) => {
        console.warn('Schedules realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach schedules listener:', e);
      return null;
    }
  },

  subscribeUsers(onUpdate: (users: KalyaniUser[]) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(collection(db, 'users'), (snapshot) => {
        const users: KalyaniUser[] = [];
        snapshot.forEach((docSnap) => {
          users.push(docSnap.data() as KalyaniUser);
        });
        if (!listenerHasData.users && users.length === 0) return;
        listenerHasData.users = true;
        onUpdate(users);
      }, (err) => {
        console.warn('Users realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach users listener:', e);
      return null;
    }
  },

  subscribeDepartments(onUpdate: (departments: Department[]) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(collection(db, 'departments'), (snapshot) => {
        const departments: Department[] = [];
        snapshot.forEach((docSnap) => {
          departments.push(docSnap.data() as Department);
        });
        if (!listenerHasData.departments && departments.length === 0) return;
        listenerHasData.departments = true;
        onUpdate(departments);
      }, (err) => {
        console.warn('Departments realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach departments listener:', e);
      return null;
    }
  },

  subscribeSubjects(onUpdate: (subjects: Subject[]) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(collection(db, 'subjects'), (snapshot) => {
        const subjects: Subject[] = [];
        snapshot.forEach((docSnap) => {
          subjects.push(docSnap.data() as Subject);
        });
        if (!listenerHasData.subjects && subjects.length === 0) return;
        listenerHasData.subjects = true;
        onUpdate(subjects);
      }, (err) => {
        console.warn('Subjects realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach subjects listener:', e);
      return null;
    }
  },

  subscribePeriods(onUpdate: (periods: Period[]) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(collection(db, 'periods'), (snapshot) => {
        const periods: Period[] = [];
        snapshot.forEach((docSnap) => {
          periods.push(docSnap.data() as Period);
        });
        if (!listenerHasData.periods && periods.length === 0) return;
        listenerHasData.periods = true;
        periods.sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
        onUpdate(periods);
      }, (err) => {
        console.warn('Periods realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach periods listener:', e);
      return null;
    }
  },

  subscribeSystemSettings(onUpdate: (settings: SystemSettings) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as SystemSettings);
        }
      }, (err) => {
        console.warn('System settings realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach system settings listener:', e);
      return null;
    }
  },

  subscribeAcademicConfigs(onUpdate: (configs: Record<string, AcademicConfiguration>) => void): Unsubscribe | null {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      return onSnapshot(collection(db, 'academic_configs'), (snapshot) => {
        const configs: Record<string, AcademicConfiguration> = {};
        snapshot.forEach((docSnap) => {
          configs[docSnap.id] = docSnap.data() as AcademicConfiguration;
        });
        if (!listenerHasData.academicConfigs && Object.keys(configs).length === 0) return;
        listenerHasData.academicConfigs = true;
        onUpdate(configs);
      }, (err) => {
        console.warn('Academic configs realtime listener notice:', err);
      });
    } catch (e) {
      console.warn('Failed to attach academic configs listener:', e);
      return null;
    }
  },

  // ==========================================
  // REAL-TIME WRITE OPERATIONS
  // ==========================================

  async saveSchedule(schedule: FacultySchedule): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      const docId = `${schedule.facultyId}_${schedule.date}`;
      await setDoc(doc(db, 'schedules', docId), this.sanitizeForFirestore(schedule), { merge: true });
    } catch (err) {
      console.error('Error saving schedule to Firestore:', err);
    }
  },

  async saveUser(user: KalyaniUser): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'users', user.uid), this.sanitizeForFirestore(user), { merge: true });
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
    }
  },

  async deleteUser(uid: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      console.error('Error deleting user in Firestore:', err);
    }
  },

  async saveDepartment(department: Department): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'departments', department.id), this.sanitizeForFirestore(department), { merge: true });
    } catch (err) {
      console.error('Error saving department to Firestore:', err);
    }
  },

  async saveSubject(subject: Subject): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'subjects', subject.id), this.sanitizeForFirestore(subject), { merge: true });
    } catch (err) {
      console.error('Error saving subject to Firestore:', err);
    }
  },

  async deleteSubject(id: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (err) {
      console.error('Error deleting subject in Firestore:', err);
    }
  },

  async bulkDeleteSubjects(ids: string[]): Promise<void> {
    if (!isLiveFirebaseConfigured || !db || ids.length === 0) return;
    try {
      for (const id of ids) {
        await deleteDoc(doc(db, 'subjects', id));
      }
    } catch (err) {
      console.error('Error bulk deleting subjects in Firestore:', err);
    }
  },

  async savePeriod(period: Period): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'periods', period.id), this.sanitizeForFirestore(period), { merge: true });
    } catch (err) {
      console.error('Error saving period to Firestore:', err);
    }
  },

  async saveAcademicConfig(departmentId: string, config: AcademicConfiguration): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'academic_configs', departmentId), this.sanitizeForFirestore(config), { merge: true });
    } catch (err) {
      console.error('Error saving academic config to Firestore:', err);
    }
  },

  async saveSystemSettings(settings: SystemSettings): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await setDoc(doc(db, 'settings', 'global'), this.sanitizeForFirestore(settings), { merge: true });
    } catch (err) {
      console.error('Error saving system settings to Firestore:', err);
    }
  },

  /**
   * Purges test schedules, test users (except master admin), and resets department HOD mappings in Firestore
   */
  async purgeDatabaseForProduction(): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      // 1. Delete all schedules
      const schedSnap = await getDocs(collection(db, 'schedules'));
      for (const d of schedSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Delete all users except master administrator
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const u = d.data();
        if (u.role !== 'ADMIN' && u.uid !== 'usr_admin') {
          await deleteDoc(d.ref);
        }
      }

      // 3. Reset department HOD/AHOD pointers
      const deptSnap = await getDocs(collection(db, 'departments'));
      for (const d of deptSnap.docs) {
        const dept = d.data() as Department;
        await setDoc(d.ref, {
          ...dept,
          hodUid: null,
          hodName: null,
          ahodUid: null,
          ahodName: null,
          ahodUids: [],
          ahodNames: []
        });
      }

      // 4. Flush stale subjects and seed simplified subject catalog
      const subjSnap = await getDocs(collection(db, 'subjects'));
      for (const d of subjSnap.docs) {
        await deleteDoc(d.ref);
      }
      for (const s of INITIAL_SUBJECTS) {
        await setDoc(doc(db, 'subjects', s.id), this.sanitizeForFirestore(s));
      }

      console.log('⚡ Purged test records and synchronized clean subjects in Firestore.');
    } catch (err) {
      console.error('Error purging database in Firestore:', err);
    }
  },

  /**
   * Directly fetch a user by email from Cloud Firestore
   */
  async fetchUserByEmail(email: string): Promise<KalyaniUser | null> {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const cleanEmail = email.trim().toLowerCase();
      for (const d of usersSnap.docs) {
        const u = d.data() as KalyaniUser;
        if (u.email && u.email.trim().toLowerCase() === cleanEmail) {
          return u;
        }
      }
      return null;
    } catch (err) {
      console.error('Error finding user in Firestore:', err);
      return null;
    }
  }
};
