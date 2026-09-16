export type EntrySource = 'manual' | 'barcode' | 'photo';

export type MealType = 'ontbijt' | 'lunch' | 'diner' | 'snacks';

export const MEAL_TYPES: MealType[] = ['ontbijt', 'lunch', 'diner', 'snacks'];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  ontbijt: 'Ontbijt',
  lunch: 'Lunch',
  diner: 'Diner',
  snacks: 'Snacks',
};

export function suggestMealTypeForNow(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'ontbijt';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'diner';
  return 'snacks';
}

export interface FoodEntry {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingQty: number;
  loggedAt: number;
  source: EntrySource;
  mealType?: MealType;
  barcode?: string;
}

export interface NewFoodEntry {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingQty: number;
  source: EntrySource;
  mealType: MealType;
  barcode?: string;
}

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export type MealPhotoConfidence = 'laag' | 'gemiddeld' | 'hoog';

export interface MealPhotoEstimate {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: MealPhotoConfidence;
}
