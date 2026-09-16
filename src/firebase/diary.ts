import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import type { FoodEntry, NewFoodEntry } from '../types/food';

function startOfToday(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

function endOfToday(): number {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.getTime();
}

export function subscribeToTodayEntries(
  uid: string,
  onChange: (entries: FoodEntry[]) => void
) {
  const entriesRef = collection(db, 'users', uid, 'entries');
  const todayQuery = query(
    entriesRef,
    where('loggedAt', '>=', startOfToday()),
    where('loggedAt', '<=', endOfToday()),
    orderBy('loggedAt', 'desc')
  );

  return onSnapshot(todayQuery, (snapshot) => {
    const entries = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<FoodEntry, 'id'>),
    }));
    onChange(entries);
  });
}

export async function addFoodEntry(uid: string, entry: NewFoodEntry) {
  const entriesRef = collection(db, 'users', uid, 'entries');
  await addDoc(entriesRef, {
    ...entry,
    loggedAt: Date.now(),
  });
}

export async function deleteFoodEntry(uid: string, entryId: string) {
  await deleteDoc(doc(db, 'users', uid, 'entries', entryId));
}

export function subscribeToLastEntryTimestamp(uid: string, onChange: (loggedAt: number | null) => void) {
  const entriesRef = collection(db, 'users', uid, 'entries');
  const lastEntryQuery = query(entriesRef, orderBy('loggedAt', 'desc'), limit(1));

  return onSnapshot(lastEntryQuery, (snapshot) => {
    const firstDoc = snapshot.docs[0];
    onChange(firstDoc ? (firstDoc.data().loggedAt as number) : null);
  });
}
