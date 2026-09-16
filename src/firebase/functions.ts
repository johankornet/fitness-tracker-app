import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './config';
import type { MealPhotoEstimate } from '../types/food';
import type { Sport, Goal, WorkoutExercise, Difficulty } from '../types/workout';

const functions = getFunctions(app, 'europe-west1');

const estimateMealFromPhotoCallable = httpsCallable<
  { imageBase64: string },
  MealPhotoEstimate
>(functions, 'estimateMealFromPhoto');

export async function estimateMealFromPhoto(imageBase64: string): Promise<MealPhotoEstimate> {
  const result = await estimateMealFromPhotoCallable({ imageBase64 });
  return result.data;
}

export interface GeneratedWorkout {
  title: string;
  durationMinutes: number;
  difficulty: Difficulty;
  description: string;
  exercises: WorkoutExercise[];
  sport: Sport;
  goal: Goal;
}

const generateWorkoutCallable = httpsCallable<{ sport: Sport; goal: Goal }, GeneratedWorkout>(
  functions,
  'generateWorkout'
);

export async function generateWorkout(sport: Sport, goal: Goal): Promise<GeneratedWorkout> {
  const result = await generateWorkoutCallable({ sport, goal });
  return result.data;
}
