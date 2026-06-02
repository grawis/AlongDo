import Constants from 'expo-constants';

const extra =
  Constants.expoConfig?.extra ??
  Constants.manifest?.extra ??
  Constants.manifest2?.extra ??
  {};

const publicEnvApiKey =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ??
  process.env.GOOGLE_MAPS_API_KEY ??
  '';

const firebaseConfigFromExtra = extra.firebaseConfig || {};

export const USE_MOCK_API = !firebaseConfigFromExtra.projectId;
export const API_BASE_URL = 'http://localhost:3000';
export const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey || publicEnvApiKey || '';

export const FIREBASE_CONFIG = {
  apiKey: firebaseConfigFromExtra.apiKey || '',
  authDomain: firebaseConfigFromExtra.authDomain || '',
  projectId: firebaseConfigFromExtra.projectId || '',
  storageBucket: firebaseConfigFromExtra.storageBucket || '',
  messagingSenderId: firebaseConfigFromExtra.messagingSenderId || '',
  appId: firebaseConfigFromExtra.appId || '',
};

export const FIREBASE_ENABLED = Boolean(
  FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.projectId &&
    FIREBASE_CONFIG.appId
);
