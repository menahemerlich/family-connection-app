import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';
import { attachFirebaseServices } from './firebaseShared';

let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof attachFirebaseServices>['db'];
let storage: ReturnType<typeof attachFirebaseServices>['storage'];
let functions: ReturnType<typeof attachFirebaseServices>['functions'];

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

({ db, storage, functions } = attachFirebaseServices(app));

export { app, auth, db, storage, functions };
