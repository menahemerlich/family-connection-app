import type { FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { Platform } from 'react-native';

function firestoreForApp(app: FirebaseApp): Firestore {
  if (Platform.OS === 'web') {
    try {
      return initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });
    } catch {
      return getFirestore(app);
    }
  }
  return getFirestore(app);
}

export function attachFirebaseServices(app: FirebaseApp): {
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
} {
  return {
    db: firestoreForApp(app),
    storage: getStorage(app),
    functions: getFunctions(app, 'europe-west1'),
  };
}
