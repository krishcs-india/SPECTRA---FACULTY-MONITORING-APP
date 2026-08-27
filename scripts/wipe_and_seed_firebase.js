import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAORDu_NpbDw1nJ4Jk-u7li988WlVl_u4U',
  authDomain: 'kalyani-e2179.firebaseapp.com',
  projectId: 'kalyani-e2179',
  storageBucket: 'kalyani-e2179.firebasestorage.app',
  messagingSenderId: '213669045034',
  appId: '1:213669045034:web:5e17b300b731186471b453'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function wipeAndSeed() {
  console.log('🚀 Starting Firebase Firestore Clean-Slate Migration...');

  // 1. Wipe all documents across all collections
  const collectionsToWipe = ['users', 'departments', 'subjects', 'periods', 'schedules', 'settings'];
  
  for (const colName of collectionsToWipe) {
    const snap = await getDocs(collection(db, colName));
    console.log(`🧹 Deleting ${snap.size} documents from '${colName}'...`);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  console.log('✨ All old/redundant documents wiped.');

  // 2. Seed Pristine Master Admin
  const adminUser = {
    uid: 'usr_admin',
    name: 'ADMINISTRATOR',
    email: 'admin@krce.ac.in',
    departmentId: '',
    departmentName: 'Institutional Administration',
    designation: 'System Administrator',
    role: 'ADMIN',
    hodType: null,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'users', 'usr_admin'), adminUser);
  console.log('✅ Admin user created in Firestore (admin@krce.ac.in).');

  // 3. Seed 2 Clean Initial Departments: CSE & AIDS
  const departments = [
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
      createdAt: new Date().toISOString()
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
      createdAt: new Date().toISOString()
    }
  ];

  for (const dept of departments) {
    await setDoc(doc(db, 'departments', dept.id), dept);
    console.log(`✅ Department '${dept.code}' created in Firestore.`);
  }

  // 4. Seed Standard 8 Periods
  const standardPeriods = [
    { id: 'P01', departmentId: 'GLOBAL', name: 'Period 1', shortName: 'Period 1', startTime: '08:45', endTime: '09:35', sequence: 1, active: true },
    { id: 'P02', departmentId: 'GLOBAL', name: 'Period 2', shortName: 'Period 2', startTime: '09:35', endTime: '10:25', sequence: 2, active: true },
    { id: 'P03', departmentId: 'GLOBAL', name: 'Period 3', shortName: 'Period 3', startTime: '10:40', endTime: '11:30', sequence: 3, active: true },
    { id: 'P04', departmentId: 'GLOBAL', name: 'Period 4', shortName: 'Period 4', startTime: '11:30', endTime: '12:20', sequence: 4, active: true },
    { id: 'P05', departmentId: 'GLOBAL', name: 'Period 5', shortName: 'Period 5', startTime: '01:10', endTime: '02:00', sequence: 5, active: true },
    { id: 'P06', departmentId: 'GLOBAL', name: 'Period 6', shortName: 'Period 6', startTime: '02:00', endTime: '02:50', sequence: 6, active: true },
    { id: 'P07', departmentId: 'GLOBAL', name: 'Period 7', shortName: 'Period 7', startTime: '03:00', endTime: '03:50', sequence: 7, active: true },
    { id: 'P08', departmentId: 'GLOBAL', name: 'Period 8', shortName: 'Period 8', startTime: '03:50', endTime: '04:40', sequence: 8, active: true },
  ];

  for (const period of standardPeriods) {
    await setDoc(doc(db, 'periods', period.id), period);
  }
  console.log(`✅ Standard 8 periods created in Firestore.`);

  // 5. Seed System Settings
  const settings = {
    collegeName: 'K. RAMAKRISHNAN COLLEGE OF ENGINEERING',
    collegeDomain: 'krce.ac.in',
    enforceDomainCheck: false,
    academicYear: '2026-2027',
    currentSemester: 'ODD',
    defaultMaxPeriods: 3,
    maintenanceMode: false,
    updatedAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'settings', 'global'), settings);
  console.log(`✅ Global settings created in Firestore.`);

  console.log('\n🎉 DATABASE MIGRATION COMPLETE! Pristine schema established with ZERO test/mock data.');
}

wipeAndSeed().then(() => process.exit(0)).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
