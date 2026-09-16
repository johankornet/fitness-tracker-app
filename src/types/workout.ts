export type Sport =
  | 'hardlopen'
  | 'kracht'
  | 'yoga'
  | 'cardio'
  | 'hiit'
  | 'wandelen'
  | 'fietsen'
  | 'zwemmen';

export type Goal =
  | 'afvallen'
  | 'spieropbouw'
  | 'uithoudingsvermogen'
  | 'mobiliteit'
  | 'algemene_fitheid';

export type Difficulty = 'beginner' | 'gemiddeld' | 'gevorderd';

export interface WorkoutExercise {
  name: string;
  detail: string;
}

export interface Workout {
  id: string;
  title: string;
  sport: Sport;
  goal: Goal;
  durationMinutes: number;
  difficulty: Difficulty;
  description: string;
  exercises: WorkoutExercise[];
  source: 'curated' | 'ai';
}

export const SPORT_LABELS: Record<Sport, string> = {
  hardlopen: 'Hardlopen',
  kracht: 'Kracht',
  yoga: 'Yoga',
  cardio: 'Cardio',
  hiit: 'HIIT',
  wandelen: 'Wandelen',
  fietsen: 'Fietsen',
  zwemmen: 'Zwemmen',
};

export const GOAL_LABELS: Record<Goal, string> = {
  afvallen: 'Afvallen',
  spieropbouw: 'Spieropbouw',
  uithoudingsvermogen: 'Uithoudingsvermogen',
  mobiliteit: 'Mobiliteit',
  algemene_fitheid: 'Algemene fitheid',
};
