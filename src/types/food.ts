export type EntrySource = 'manual' | 'barcode';

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
  barcode?: string;
}

export interface UserProfile {
  dailyCalorieGoal: number;
}

export interface OpenFoodFactsProduct {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}
