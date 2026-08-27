import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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

async function inspect() {
  console.log('--- DEPARTMENTS ---');
  const dSnap = await getDocs(collection(db, 'departments'));
  dSnap.forEach(d => console.log(d.id, '=>', JSON.stringify(d.data())));

  console.log('--- USERS ---');
  const uSnap = await getDocs(collection(db, 'users'));
  uSnap.forEach(u => console.log(u.id, '=>', JSON.stringify(u.data())));

  console.log('--- SETTINGS ---');
  const sSnap = await getDocs(collection(db, 'settings'));
  sSnap.forEach(s => console.log(s.id, '=>', JSON.stringify(s.data())));
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
