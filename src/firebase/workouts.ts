import { collection, onSnapshot, addDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from './config';
import type { Workout } from '../types/workout';

export function subscribeToSavedWorkouts(uid: string, onChange: (workouts: Workout[]) => void) {
  const ref = collection(db, 'users', uid, 'workouts');
  const q = query(ref, orderBy('title'));

  return onSnapshot(q, (snapshot) => {
    const workouts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Workout, 'id'>),
    }));
    onChange(workouts);
  });
}

export async function saveWorkout(uid: string, workout: Omit<Workout, 'id'>) {
  const ref = collection(db, 'users', uid, 'workouts');
  await addDoc(ref, workout);
}

export async function deleteWorkout(uid: string, workoutId: string) {
  await deleteDoc(doc(db, 'users', uid, 'workouts', workoutId));
}
