import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

export async function recordActivity(uid: string) {
  const today = new Date().toISOString().slice(0, 10);
  await setDoc(doc(db, 'users', uid, 'activity', today), { timestamp: Date.now() }, { merge: true });
}
