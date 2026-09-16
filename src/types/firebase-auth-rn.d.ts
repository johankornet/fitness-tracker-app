import type { Persistence } from 'firebase/auth';

// firebase/auth exports getReactNativePersistence at runtime (via the
// package's "react-native" export condition, used by Metro), but its
// public .d.ts (resolved by plain tsc) omits it. This augmentation adds
// the missing type so the app can use the real runtime export.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
