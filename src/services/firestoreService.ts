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
import { KalyaniUser, UserRole, HodType } from '../types/user';
import { Department } from '../types/department';
import { Subject } from '../types/subject';
import { Period } from '../types/period';
import { SystemSettings } from '../types/configuration';
import {
  INITIAL_USERS,
  INITIAL_DEPARTMENTS,
  INITIAL_PERIODS,
  INITIAL_SETTINGS
} from './seedDataService';

// Realtime Firestore synchronization for institutional academic data
export interface CloudSyncHandlers {
  onSchedules: (data: Record<string, FacultySchedule>) => void;
  onUsers: (data: KalyaniUser[]) => void;
  onDepartments: (data: Department[]) => void;
  onSubjects: (data: Subject[]) => void;
  onPeriods: (data: Period[]) => void;
  onSystemSettings: (data: SystemSettings) => void;
}

let syncHandlers: CloudSyncHandlers | null = null;
let cloudSyncUnsubscribes: Unsubscribe[] = [];
let realtimeSyncStarted = false;

export const firestoreService = {
  /**
   * Store registers its state-update callbacks here
   */
  registerSyncHandlers(handlers: CloudSyncHandlers): void {
    syncHandlers = handlers;
    if (realtimeSyncStarted) {
      this.attachCloudSync();
    }
  },

  /**
   * Initializes real-time synchronization immediately on boot.
   */
  initRealtimeSync(): void {
    if (!isLiveFirebaseConfigured || !db || realtimeSyncStarted) return;
    realtimeSyncStarted = true;
    console.log('🔥 Initializing real-time Cloud Firestore synchronization...');
    this.attachCloudSync();
  },

  initAuthSync(): void {
    this.initRealtimeSync();
  },

  attachCloudSync(): void {
    if (!isLiveFirebaseConfigured || !db || !syncHandlers) return;

    this.detachCloudSync();
    this.ensureDatabaseInitialized();

    const subs = [
      this.subscribeSchedules((data) => syncHandlers?.onSchedules(data)),
      this.subscribeUsers((data) => syncHandlers?.onUsers(data)),
      this.subscribeDepartments((data) => syncHandlers?.onDepartments(data)),
      this.subscribeSubjects((data) => syncHandlers?.onSubjects(data)),
      this.subscribePeriods((data) => syncHandlers?.onPeriods(data)),
      this.subscribeSystemSettings((data) => syncHandlers?.onSystemSettings(data))
    ];
    cloudSyncUnsubscribes.push(...subs.filter((s): s is Unsubscribe => s !== null));
  },

  detachCloudSync(): void {
    cloudSyncUnsubscribes.forEach((unsub) => {
      try { unsub(); } catch {}
    });
    cloudSyncUnsubscribes = [];
  },

  /**
   * Converts undefined values to null so Firestore setDoc never throws
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
   * Initializes Firestore with baseline master records if totally empty
   */
  async ensureDatabaseInitialized(): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;

    try {
      // 1. Check departments
      const deptSnap = await getDocs(collection(db, 'departments'));
      if (deptSnap.empty) {
        console.log('⚡ Initializing Firestore default departments (CSE, AIDS)...');
        const batch = writeBatch(db);
        INITIAL_DEPARTMENTS.forEach((d) => {
          const ref = doc(db, 'departments', d.id);
          batch.set(ref, firestoreService.sanitizeForFirestore(d));
        });
        await batch.commit();
      }

      // 2. Check users (ensure admin exists)
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        console.log('⚡ Initializing Firestore master administrator...');
        const batch = writeBatch(db);
        INITIAL_USERS.forEach((u) => {
          const ref = doc(db, 'users', u.uid);
          batch.set(ref, firestoreService.sanitizeForFirestore(u));
        });
        await batch.commit();
      }

      // 3. Check periods
      const periodsSnap = await getDocs(collection(db, 'periods'));
      if (periodsSnap.empty) {
        console.log('⚡ Initializing Firestore standard periods...');
        const batch = writeBatch(db);
        INITIAL_PERIODS.forEach((p) => {
          const ref = doc(db, 'periods', p.id);
          batch.set(ref, firestoreService.sanitizeForFirestore(p));
        });
        await batch.commit();
      }

      // 4. Check system settings
      const settingsRef = doc(db, 'settings', 'global');
      const batch = writeBatch(db);
      batch.set(settingsRef, firestoreService.sanitizeForFirestore(INITIAL_SETTINGS), { merge: true });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore initialization notice:', err);
    }
  },

  /**
   * Complete Database Rebuild & Clean Re-seed
   */
  async rebuildAndSeedDatabase(): Promise<{ success: boolean; error?: string }> {
    if (!isLiveFirebaseConfigured || !db) {
      return { success: false, error: 'Firebase is not connected in live mode.' };
    }

    try {
      console.log('🔄 Rebuilding & Seeding Cloud Firestore Database...');

      // 1. Departments (CSE, AIDS)
      const deptBatch = writeBatch(db);
      INITIAL_DEPARTMENTS.forEach((d) => {
        const ref = doc(db, 'departments', d.id);
        deptBatch.set(ref, firestoreService.sanitizeForFirestore(d));
      });
      await deptBatch.commit();

      // 2. Master Admin
      const userBatch = writeBatch(db);
      INITIAL_USERS.forEach((u) => {
        const ref = doc(db, 'users', u.uid);
        userBatch.set(ref, firestoreService.sanitizeForFirestore(u));
      });
      await userBatch.commit();

      // 3. Standard Periods
      const periodBatch = writeBatch(db);
      INITIAL_PERIODS.forEach((p) => {
        const ref = doc(db, 'periods', p.id);
        periodBatch.set(ref, firestoreService.sanitizeForFirestore(p));
      });
      await periodBatch.commit();

      // 4. System Settings
      const settingsRef = doc(db, 'settings', 'global');
      await setDoc(settingsRef, firestoreService.sanitizeForFirestore(INITIAL_SETTINGS));

      console.log('✅ Firestore Database Baseline Synchronized.');
      return { success: true };
    } catch (err: any) {
      console.error('Error rebuilding database:', err);
      return { success: false, error: err?.message || 'Database rebuild failed.' };
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

  async deleteScheduleDoc(scheduleId: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
    } catch (err) {
      console.error('Error deleting schedule doc in Firestore:', err);
    }
  },

  async deleteTodaySchedulesForDepartment(departmentId: string, todayDate: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      const cleanDept = (departmentId || '').toUpperCase().trim();
      const snap = await getDocs(collection(db, 'schedules'));
      for (const d of snap.docs) {
        const data = d.data() as FacultySchedule;
        if ((data.departmentId || '').toUpperCase().trim() === cleanDept && data.date === todayDate) {
          await deleteDoc(d.ref);
        }
      }
    } catch (err) {
      console.error('Error deleting today schedules for department:', err);
    }
  },

  async deleteSchedulesForUser(userId: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      const snap = await getDocs(collection(db, 'schedules'));
      for (const d of snap.docs) {
        const data = d.data();
        if (data.facultyId === userId || d.id.startsWith(`${userId}_`)) {
          await deleteDoc(d.ref);
        }
      }
    } catch (err) {
      console.error('Error deleting user schedules in Firestore:', err);
    }
  },

  async fetchUserByEmail(email: string): Promise<KalyaniUser | null> {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      const clean = email.trim().toLowerCase();
      const snap = await getDocs(collection(db, 'users'));
      for (const d of snap.docs) {
        const u = d.data() as KalyaniUser;
        if ((u.email || '').trim().toLowerCase() === clean) {
          return {
            ...u,
            uid: u.uid || d.id,
            email: (u.email || '').trim().toLowerCase(),
            role: (u.role || 'FACULTY').toString().toUpperCase() as UserRole,
            hodType: u.hodType ? (u.hodType.toString().toUpperCase() as HodType) : null,
            active: u.active !== false
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('Error fetching user by email from Firestore:', err);
      return null;
    }
  },

  async fetchUserById(uid: string): Promise<KalyaniUser | null> {
    if (!isLiveFirebaseConfigured || !db) return null;
    try {
      const snap = await getDocs(collection(db, 'users'));
      for (const d of snap.docs) {
        const u = d.data() as KalyaniUser;
        if (d.id === uid || u.uid === uid) {
          return {
            ...u,
            uid: u.uid || d.id,
            email: (u.email || '').trim().toLowerCase(),
            role: (u.role || 'FACULTY').toString().toUpperCase() as UserRole,
            hodType: u.hodType ? (u.hodType.toString().toUpperCase() as HodType) : null,
            active: u.active !== false
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('Error fetching user by ID from Firestore:', err);
      return null;
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

  async deleteDepartment(id: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (err) {
      console.error('Error deleting department in Firestore:', err);
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
      console.error('Error deleting subject from Firestore:', err);
    }
  },

  async bulkDeleteSubjects(ids: string[]): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.delete(doc(db, 'subjects', id));
      });
      await batch.commit();
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

  async deletePeriodDoc(id: string): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'periods', id));
    } catch (err) {
      console.error('Error deleting period doc in Firestore:', err);
    }
  },

  async savePeriodsBatch(periods: Period[]): Promise<void> {
    if (!isLiveFirebaseConfigured || !db || periods.length === 0) return;
    try {
      const batch = writeBatch(db);
      periods.forEach((p) => {
        batch.set(doc(db, 'periods', p.id), this.sanitizeForFirestore(p), { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error saving periods batch to Firestore:', err);
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
   * Purges database to clean slate for production
   */
  async purgeDatabaseForProduction(): Promise<void> {
    if (!isLiveFirebaseConfigured || !db) return;
    try {
      // 1. Delete all schedules
      const schedSnap = await getDocs(collection(db, 'schedules'));
      for (const d of schedSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 2. Delete all non-admin users
      const usersSnap = await getDocs(collection(db, 'users'));
      for (const d of usersSnap.docs) {
        const u = d.data();
        if (u.role !== 'ADMIN' && u.uid !== 'usr_admin') {
          await deleteDoc(d.ref);
        }
      }

      // 3. Reset department HOD mappings
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

      // 4. Delete all subjects
      const subjSnap = await getDocs(collection(db, 'subjects'));
      for (const d of subjSnap.docs) {
        await deleteDoc(d.ref);
      }

      // 5. Reset periods to standard baseline
      const periodSnap = await getDocs(collection(db, 'periods'));
      for (const d of periodSnap.docs) {
        await deleteDoc(d.ref);
      }
      for (const p of INITIAL_PERIODS) {
        await setDoc(doc(db, 'periods', p.id), this.sanitizeForFirestore(p));
      }

      console.log('⚡ Purged records to clean production slate.');
    } catch (err) {
      console.error('Error purging database in Firestore:', err);
    }
  }
};
