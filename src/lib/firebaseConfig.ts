import Constants from 'expo-constants';

type FirebasePublicConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

function trimStr(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

/** מ-app.config (extra) או מ-Metro שמחליף EXPO_PUBLIC_* מקובץ .env */
function envFirebase(ex: FirebasePublicConfig): FirebasePublicConfig {
  return {
    apiKey: trimStr(ex.apiKey) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    authDomain: trimStr(ex.authDomain) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: trimStr(ex.projectId) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: trimStr(ex.storageBucket) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId:
      trimStr(ex.messagingSenderId) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
    appId: trimStr(ex.appId) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
    measurementId:
      trimStr(ex.measurementId) ?? trimStr(process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID),
  };
}

const fromExtra = (Constants.expoConfig?.extra?.firebase ?? {}) as FirebasePublicConfig;

export const firebaseConfig = envFirebase(fromExtra);

if (!firebaseConfig.apiKey) {
  console.warn(
    '[firebase] חסרה תצורה — וודא שהגדרת משתני EXPO_PUBLIC_FIREBASE_* בקובץ .env והפעלת מחדש את Metro',
  );
}
