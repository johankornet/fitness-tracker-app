import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import type { WeeklyInsight } from './functions';

export async function getCachedTodayInsight(uid: string): Promise<WeeklyInsight | null> {
  const today = new Date().toISOString().slice(0, 10);
  const snap = await getDoc(doc(db, 'users', uid, 'insights', today));
  return snap.exists() ? (snap.data() as WeeklyInsight) : null;
}
