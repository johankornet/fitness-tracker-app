import type { Sport, Goal } from './workout';

export interface UserProfile {
  name?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  dailyCalorieGoal: number;
  sport?: Sport;
  goal?: Goal;
}
