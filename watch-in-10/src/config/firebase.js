import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
};

let app = null;
let db = null;

export function isFirebaseConfigured() {
  return !!firebaseConfig.databaseURL;
}

export function getFirebaseDB() {
  if (!isFirebaseConfigured()) return null;
  if (!db) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return db;
}
