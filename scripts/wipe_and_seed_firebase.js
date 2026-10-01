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

  // 4. Seed Standard 8 Periods for CSE, AIDS, and GLOBAL
  for (const deptId of ['CSE', 'AIDS', 'GLOBAL']) {
    for (let num = 1; num <= 8; num++) {
      const pid = `P_${deptId}_${num}`;
      const periodDoc = {
        id: pid,
        departmentId: deptId,
        name: `Period ${num}`,
        shortName: `Period ${num}`,
        sequence: num,
        active: true
      };
      await setDoc(doc(db, 'periods', pid), periodDoc);
    }
  }
  console.log(`✅ Standard 8 periods created for CSE, AIDS, and GLOBAL in Firestore.`);

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
