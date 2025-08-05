import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { API_KEY, STORAGE_BUCKET } from '@env';

console.log('🎯 API_KEY from .env:', API_KEY);
console.log('🎯 STORAGE_BUCKET from .env:', STORAGE_BUCKET);

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: "pre-link-255c8.firebaseapp.com",
  projectId: "pre-link-255c8",
  storageBucket: STORAGE_BUCKET || "pre-link-255c8.appspot.com",
  messagingSenderId: "987884133807",
  appId: "1:987884133807:web:5659b3947b7c93526e235a"
};

const app = initializeApp(firebaseConfig);
console.log('✅ Firebase initialized with app:', app.name);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west2');

console.log('✅ Auth module ready.');
console.log('✅ Firestore module ready.');
console.log('✅ Storage module ready. Bucket:', firebaseConfig.storageBucket);

export { auth, db, storage, app };
