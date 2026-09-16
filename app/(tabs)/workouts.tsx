import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeToSavedWorkouts } from '../../src/firebase/workouts';
import { CURATED_WORKOUTS } from '../../src/data/workouts';
import { SPORT_LABELS, GOAL_LABELS } from '../../src/types/workout';
import type { Sport, Goal, Workout } from '../../src/types/workout';
import { ChipPicker } from '../../src/components/ChipPicker';
import { colors } from '../../src/theme/colors';

const SPORT_OPTIONS = (Object.keys(SPORT_LABELS) as Sport[]).map((value) => ({
  value,
  label: SPORT_LABELS[value],
}));
const GOAL_OPTIONS = (Object.keys(GOAL_LABELS) as Goal[]).map((value) => ({
  value,
  label: GOAL_LABELS[value],
}));

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([]);
  const [sportFilter, setSportFilter] = useState<Sport | null>(null);
  const [goalFilter, setGoalFilter] = useState<Goal | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeToSavedWorkouts(user.uid, setSavedWorkouts);
  }, [user]);

  const allWorkouts = useMemo(
    () => [...savedWorkouts, ...CURATED_WORKOUTS],
    [savedWorkouts]
  );

  const filtered = useMemo(
    () =>
      allWorkouts.filter(
        (w) => (!sportFilter || w.sport === sportFilter) && (!goalFilter || w.goal === goalFilter)
      ),
    [allWorkouts, sportFilter, goalFilter]
  );

  function openWorkout(workout: Workout) {
    router.push({
      pathname: '/workout-detail',
      params: { workout: JSON.stringify(workout) },
    });
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.aiButton} onPress={() => router.push('/ai-workout')}>
        <Text style={styles.aiButtonText}>✨ Laat AI een training maken</Text>
      </Pressable>

      <View style={styles.filters}>
        <ChipPicker options={SPORT_OPTIONS} value={sportFilter} onChange={setSportFilter} allowClear />
        <ChipPicker options={GOAL_OPTIONS} value={goalFilter} onChange={setGoalFilter} allowClear />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Geen trainingen gevonden voor deze filters.</Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openWorkout(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {SPORT_LABELS[item.sport]} · {GOAL_LABELS[item.goal]} · {item.durationMinutes} min
              </Text>
            </View>
            {item.source === 'ai' && <Text style={styles.aiTag}>AI</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  aiButton: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  aiButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  filters: { paddingHorizontal: 16, gap: 8 },
  list: { padding: 16, gap: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  cardMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  aiTag: {
    color: colors.accentLight,
    borderWidth: 1,
    borderColor: colors.accentLight,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
