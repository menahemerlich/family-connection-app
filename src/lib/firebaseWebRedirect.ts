/**
 * יישום מוקדם של תוצאת OAuth אחרי signInWithRedirect — לפני ריאקט/רואטר,
 * כדי שלא יאבדו פרמטרי החזרה או מצב ה-pending ב־IndexedDB.
 */
import { getRedirectResult, browserPopupRedirectResolver } from 'firebase/auth';
import { auth } from './firebase';
import { describeAuthError } from './authMessages';
import { useAuthStore } from '@/stores/authStore';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void getRedirectResult(auth, browserPopupRedirectResolver)
    .then((result) => {
      if (result?.user) {
        useAuthStore.getState().setLastAuthError(null, null);
      }
    })
    .catch((err) => {
      const { title, hint } = describeAuthError(err);
      useAuthStore.getState().setLastAuthError(`אחרי חזרה מגוגל: ${title}`, hint ?? null);
      console.warn('[auth] getRedirectResult', err);
    });
}
