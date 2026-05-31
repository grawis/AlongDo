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

export const USE_MOCK_API = true;
export const API_BASE_URL = 'http://localhost:3000';
export const GOOGLE_MAPS_API_KEY = extra.googleMapsApiKey || publicEnvApiKey || '';
