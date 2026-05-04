import { firebaseConfig } from './firebaseConfig';

export type MissingFirebaseField = { field: string; envVar: string };

const REQUIRED: MissingFirebaseField[] = [
  { field: 'apiKey', envVar: 'EXPO_PUBLIC_FIREBASE_API_KEY' },
  { field: 'authDomain', envVar: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN' },
  { field: 'projectId', envVar: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID' },
  { field: 'storageBucket', envVar: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET' },
  { field: 'messagingSenderId', envVar: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID' },
  { field: 'appId', envVar: 'EXPO_PUBLIC_FIREBASE_APP_ID' },
];

export function getMissingFirebaseEnvFields(): MissingFirebaseField[] {
  return REQUIRED.filter(({ field }) => {
    const v = firebaseConfig[field as keyof typeof firebaseConfig];
    return v == null || String(v).trim() === '';
  });
}
