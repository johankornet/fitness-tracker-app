import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { deleteWorkout, logWorkoutCompletion } from '../src/firebase/workouts';
import { WorkoutDetailView } from '../src/components/WorkoutDetailView';
import type { Workout } from '../src/types/workout';
import { colors } from '../src/theme/colors';

export default function WorkoutDetailScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ workout: string }>();
  const [completed, setCompleted] = useState(false);
  const [loggingCompletion, setLoggingCompletion] = useState(false);

  const workout = useMemo<Workout | null>(() => {
    try {
      return params.workout ? JSON.parse(params.workout) : null;
    } catch {
      return null;
    }
  }, [params.workout]);

  if (!workout) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Training niet gevonden.</Text>
      </View>
    );
  }

  function confirmDelete() {
    if (!user || !workout) return;
    Alert.alert('Training verwijderen?', workout.title, [
      { text: 'Annuleren', style: 'cancel' },
      {
        text: 'Verwijderen',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(user.uid, workout.id);
          router.back();
        },
      },
    ]);
  }

  async function handleMarkCompleted() {
    if (!user || !workout || completed) return;
    setLoggingCompletion(true);
    try {
      await logWorkoutCompletion(user.uid, workout);
      setCompleted(true);
    } finally {
      setLoggingCompletion(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WorkoutDetailView workout={workout} />

      <Pressable
        style={[styles.completeButton, completed && styles.completeButtonDone]}
        onPress={handleMarkCompleted}
        disabled={loggingCompletion || completed}
      >
        <Text style={styles.completeButtonText}>
          {completed ? '✓ Training voltooid' : loggingCompletion ? 'Bezig...' : 'Markeer als voltooid'}
        </Text>
      </Pressable>

      {workout.source === 'ai' && (
        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteButtonText}>Verwijderen uit mijn trainingen</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  message: { color: colors.textPrimary },
  completeButton: {
    marginTop: 24,
    backgroundColor: colors.accent,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
  },
  completeButtonDone: { backgroundColor: colors.success },
  completeButtonText: { color: colors.white, fontWeight: '700' },
  deleteButton: {
    marginTop: 12,
    padding: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteButtonText: { color: colors.danger, fontWeight: '600' },
});
