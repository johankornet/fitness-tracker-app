import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

const DEFAULT_DAILY_CALORIE_GOAL = 2000;

export async function signUp(email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', credential.user.uid), {
    dailyCalorieGoal: DEFAULT_DAILY_CALORIE_GOAL,
  });
  return credential.user;
}

export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}
