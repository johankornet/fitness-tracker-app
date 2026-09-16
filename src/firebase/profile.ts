import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import type { UserProfile } from '../types/profile';

const DEFAULT_PROFILE: UserProfile = { dailyCalorieGoal: 2000 };

export async function getUserProfile(uid: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return { ...DEFAULT_PROFILE, ...(snap.data() as UserProfile) };
  }
  return DEFAULT_PROFILE;
}

export async function updateUserProfile(uid: string, changes: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), changes, { merge: true });
}
