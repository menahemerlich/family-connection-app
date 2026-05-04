import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { UserDoc } from '@/types/models';

type AuthState = {
  firebaseUser: User | null;
  profile: UserDoc | null;
  isInitialized: boolean;
  lastAuthError: string | null;
  lastAuthHint: string | null;
  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: UserDoc | null) => void;
  setInitialized: (v: boolean) => void;
  setLastAuthError: (title: string | null, hint?: string | null) => void;
  clearLastAuthError: () => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  isInitialized: false,
  lastAuthError: null,
  lastAuthHint: null,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setLastAuthError: (title, hint) =>
    set({
      lastAuthError: title,
      lastAuthHint: hint === undefined ? null : hint,
    }),
  clearLastAuthError: () => set({ lastAuthError: null, lastAuthHint: null }),
  reset: () =>
    set({
      firebaseUser: null,
      profile: null,
      lastAuthError: null,
      lastAuthHint: null,
    }),
}));
