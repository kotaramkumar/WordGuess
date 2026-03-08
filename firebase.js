import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBUP5RKlFN1UfGL9JgDq2owjTZDMip9sgI',
  authDomain: 'wordguess-67301.firebaseapp.com',
  projectId: 'wordguess-67301',
  storageBucket: 'wordguess-67301.firebasestorage.app',
  messagingSenderId: '64457115207',
  appId: '1:64457115207:web:722447bf732aa7e6b8d362',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
