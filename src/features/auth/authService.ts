import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
  browserPopupRedirectResolver,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '@/lib/firebase';
import { describeAuthError } from '@/lib/authMessages';
import { clearPendingJoinToken, setPendingJoinTokenForOAuth } from '@/lib/pendingJoinTokenWeb';
import { useAuthStore } from '@/stores/authStore';
import type { UserDoc } from '@/types/models';

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  await ensureUserProfile(cred.user, { displayName });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

/**
 * ב-Web משתמשים ב-redirect — אחרי החזרה מהדף של Google הדפדפן נטען מחדש; אין להפעיל router.replace אחרי הקריאה.
 * אם יש קישור הצטרפות, יש לשלוח `joinToken` כדי שננווט ל-/join אחרי שהמשתמש מחובר.
 */
export async function signInWithGoogle(options?: { joinToken?: string }): Promise<void> {
  if (Platform.OS !== 'web') {
    throw new Error('כרגע התחברות עם Google זמינה רק ב-Web. ב-Native נדרש @react-native-google-signin');
  }
  useAuthStore.getState().clearLastAuthError();
  const join = options?.joinToken?.trim();
  if (join) {
    setPendingJoinTokenForOAuth(join);
  }
  const provider = new GoogleAuthProvider();
  try {
    await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
  } catch (err) {
    if (join) clearPendingJoinToken();
    const { title, hint } = describeAuthError(err);
    useAuthStore.getState().setLastAuthError(`לא ניתן להתחיל התחברות Google: ${title}`, hint ?? null);
    throw err;
  }
}

export async function signOut(): Promise<void> {
  clearPendingJoinToken();
  await fbSignOut(auth);
}

export async function ensureUserProfile(
  user: User,
  overrides?: Partial<UserDoc>,
): Promise<UserDoc> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { uid: user.uid, ...(snap.data() as Omit<UserDoc, 'uid'>) };
  }
  const profile: UserDoc = {
    uid: user.uid,
    displayName: overrides?.displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'משתמש',
    email: user.email ?? '',
    photoURL: user.photoURL ?? null,
    phone: user.phoneNumber ?? null,
    familyId: null,
    fcmTokens: [],
    locale: 'he',
    isOnline: true,
    locationOptIn: false,
    ...overrides,
  };
  await setDoc(ref, { ...profile, createdAt: serverTimestamp(), lastSeenAt: serverTimestamp() });
  return profile;
}
