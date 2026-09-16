import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { generateWorkout, type GeneratedWorkout } from '../src/firebase/functions';
import { saveWorkout } from '../src/firebase/workouts';
import { SPORT_LABELS, GOAL_LABELS } from '../src/types/workout';
import type { Sport, Goal } from '../src/types/workout';
import { ChipPicker } from '../src/components/ChipPicker';
import { WorkoutDetailView } from '../src/components/WorkoutDetailView';
import { colors } from '../src/theme/colors';

const SPORT_OPTIONS = (Object.keys(SPORT_LABELS) as Sport[]).map((value) => ({
  value,
  label: SPORT_LABELS[value],
}));
const GOAL_OPTIONS = (Object.keys(GOAL_LABELS) as Goal[]).map((value) => ({
  value,
  label: GOAL_LABELS[value],
}));

export default function AiWorkoutScreen() {
  const { user } = useAuth();
  const [sport, setSport] = useState<Sport | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedWorkout | null>(null);

  async function handleGenerate() {
    if (!sport || !goal) {
      setError('Kies eerst een sport en een doel.');
      return;
    }
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const workout = await generateWorkout(sport, goal);
      setResult(workout);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Genereren mislukt. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user || !result) return;
    setSaving(true);
    try {
      await saveWorkout(user.uid, { ...result, source: 'ai' });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Sport</Text>
      <ChipPicker options={SPORT_OPTIONS} value={sport} onChange={setSport} />

      <Text style={styles.label}>Doel</Text>
      <ChipPicker options={GOAL_OPTIONS} value={goal} onChange={setGoal} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.generateButton} onPress={handleGenerate} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.generateButtonText}>
            {result ? 'Opnieuw genereren' : '✨ Genereer training'}
          </Text>
        )}
      </Pressable>

      {result && (
        <View style={styles.resultCard}>
          <WorkoutDetailView workout={result} />

          <Pressable
            style={[styles.saveButton, saved && styles.saveButtonDone]}
            onPress={handleSave}
            disabled={saving || saved}
          >
            <Text style={styles.saveButtonText}>
              {saved ? '✓ Opgeslagen bij mijn trainingen' : saving ? 'Bezig...' : 'Bewaar deze training'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  label: { color: colors.textPrimary, fontWeight: '700', marginTop: 8 },
  error: { color: colors.danger },
  generateButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  generateButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  resultCard: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.accentLight,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonDone: { borderColor: colors.success },
  saveButtonText: { color: colors.accentLight, fontWeight: '700' },
});
