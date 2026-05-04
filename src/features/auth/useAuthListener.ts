import { useLayoutEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { AppState } from 'react-native';
import { auth, db } from '@/lib/firebase';
import { describeFirestoreError } from '@/lib/authMessages';
import { useAuthStore } from '@/stores/authStore';
import { ensureUserProfile } from './authService';
import type { UserDoc } from '@/types/models';

/** getRedirectResult רץ ב־firebaseWebRedirect (ניטען מוקדם מ־app/_layout). */

export function useAuthListener() {
  const setFirebaseUser = useAuthStore((s) => s.setFirebaseUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setLastAuthError = useAuthStore((s) => s.setLastAuthError);

  useLayoutEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubProfile?.();
      unsubProfile = null;

      if (!user) {
        setFirebaseUser(null);
        setProfile(null);
        setInitialized(true);
        return;
      }

      setFirebaseUser(user);
      try {
        await ensureUserProfile(user);
      } catch (err) {
        const { title, hint } = describeFirestoreError(err);
        setLastAuthError(`שמירת פרופיל משתמש נכשלה: ${title}`, hint ?? null);
        console.warn('[auth] ensureUserProfile failed', err);
      }

      const ref = doc(db, 'users', user.uid);
      unsubProfile = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            setProfile({ uid: user.uid, ...(snap.data() as Omit<UserDoc, 'uid'>) });
          }
          setInitialized(true);
        },
        (err) => {
          const { title, hint } = describeFirestoreError(err);
          setLastAuthError(`לא ניתן לטעון את פרופיל המשתמש: ${title}`, hint ?? null);
          setInitialized(true);
        },
      );

      try {
        await updateDoc(ref, { isOnline: true, lastSeenAt: serverTimestamp() });
      } catch {
        // ignore
      }
    });

    const sub = AppState.addEventListener('change', async (state) => {
      const u = auth.currentUser;
      if (!u) return;
      const ref = doc(db, 'users', u.uid);
      try {
        await updateDoc(ref, {
          isOnline: state === 'active',
          lastSeenAt: serverTimestamp(),
        });
      } catch {
        // ignore
      }
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
      sub.remove();
    };
  }, [setFirebaseUser, setProfile, setInitialized, setLastAuthError]);
}
