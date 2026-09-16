import { View, Text, StyleSheet } from 'react-native';
import { SPORT_LABELS, GOAL_LABELS } from '../types/workout';
import type { Workout } from '../types/workout';
import { colors } from '../theme/colors';

interface WorkoutDetailViewProps {
  workout: Omit<Workout, 'id' | 'source'>;
}

export function WorkoutDetailView({ workout }: WorkoutDetailViewProps) {
  return (
    <View>
      <Text style={styles.title}>{workout.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaTag}>{SPORT_LABELS[workout.sport]}</Text>
        <Text style={styles.metaTag}>{GOAL_LABELS[workout.goal]}</Text>
        <Text style={styles.metaTag}>{workout.durationMinutes} min</Text>
        <Text style={styles.metaTag}>{workout.difficulty}</Text>
      </View>

      <Text style={styles.description}>{workout.description}</Text>

      <Text style={styles.sectionTitle}>Oefeningen</Text>
      {workout.exercises.map((exercise, index) => (
        <View key={`${exercise.name}-${index}`} style={styles.exerciseRow}>
          <View style={styles.exerciseBullet} />
          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseDetail}>{exercise.detail}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  metaTag: {
    color: colors.accentLight,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  exerciseName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  exerciseDetail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
