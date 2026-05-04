import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  type Auth,
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';
import { attachFirebaseServices } from './firebaseShared';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let app: FirebaseApp;
let auth: Auth;
let db: ReturnType<typeof attachFirebaseServices>['db'];
let storage: ReturnType<typeof attachFirebaseServices>['storage'];
let functions: ReturnType<typeof attachFirebaseServices>['functions'];

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  if (isBrowser) {
    try {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
        popupRedirectResolver: browserPopupRedirectResolver,
      });
    } catch {
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} else {
  app = getApp();
  auth = getAuth(app);
}

({ db, storage, functions } = attachFirebaseServices(app));

export { app, auth, db, storage, functions };
