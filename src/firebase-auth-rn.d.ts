/**
 * Types for Firebase Auth persistence on React Native (subpath not always resolved by TS).
 */
declare module 'firebase/auth/react-native' {
  import type { Persistence } from 'firebase/auth';

  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
