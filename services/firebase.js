import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG, FIREBASE_ENABLED } from './config';

let firebaseApp = null;
let firestoreDb = null;

if (FIREBASE_ENABLED) {
  firebaseApp = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
  firestoreDb = getFirestore(firebaseApp);
}

export const isFirebaseConfigured = FIREBASE_ENABLED;
export const db = firestoreDb;
export { firebaseApp };
