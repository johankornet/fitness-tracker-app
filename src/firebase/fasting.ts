import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';

export function subscribeToManualFastStart(uid: string, onChange: (startedAt: number | null) => void) {
  return onSnapshot(doc(db, 'users', uid, 'fasting', 'current'), (snap) => {
    onChange(snap.exists() ? (snap.data().startedAt as number) : null);
  });
}

export async function startFastNow(uid: string) {
  await setDoc(doc(db, 'users', uid, 'fasting', 'current'), { startedAt: Date.now() });
}
