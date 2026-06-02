import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  signInAnonymously,
} from 'firebase/auth';
import { firebaseApp, isFirebaseConfigured } from './firebase';

let auth = null;

if (isFirebaseConfigured && firebaseApp) {
  try {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    auth = getAuth(firebaseApp);
  }
}

export const firebaseAuth = auth;
export const isAuthEnabled = Boolean(auth);

export async function ensureAnonymousAuth() {
  if (!auth) {
    return {
      uid: 'local-user',
      isAnonymous: true,
    };
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function getCurrentAuthUser() {
  return auth?.currentUser || null;
}
