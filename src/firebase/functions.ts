import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './config';
import type { MealPhotoEstimate } from '../types/food';

const functions = getFunctions(app, 'europe-west1');

const estimateMealFromPhotoCallable = httpsCallable<
  { imageBase64: string },
  MealPhotoEstimate
>(functions, 'estimateMealFromPhoto');

export async function estimateMealFromPhoto(imageBase64: string): Promise<MealPhotoEstimate> {
  const result = await estimateMealFromPhotoCallable({ imageBase64 });
  return result.data;
}
