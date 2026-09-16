import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { getUserProfile, updateUserProfile } from '../src/firebase/profile';
import { SPORT_LABELS, GOAL_LABELS } from '../src/types/workout';
import type { Sport, Goal } from '../src/types/workout';
import { ChipPicker } from '../src/components/ChipPicker';
import { colors } from '../src/theme/colors';

const SPORT_OPTIONS = (Object.keys(SPORT_LABELS) as Sport[]).map((value) => ({
  value,
  label: SPORT_LABELS[value],
}));
const GOAL_OPTIONS = (Object.keys(GOAL_LABELS) as Goal[]).map((value) => ({
  value,
  label: GOAL_LABELS[value],
}));

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('');
  const [sport, setSport] = useState<Sport | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((profile) => {
      setName(profile.name ?? '');
      setAge(profile.age ? String(profile.age) : '');
      setHeightCm(profile.heightCm ? String(profile.heightCm) : '');
      setWeightKg(profile.weightKg ? String(profile.weightKg) : '');
      setDailyCalorieGoal(String(profile.dailyCalorieGoal));
      setSport(profile.sport ?? null);
      setGoal(profile.goal ?? null);
      setLoading(false);
    });
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setError(null);

    const parsedGoalCalories = Number(dailyCalorieGoal);
    if (!Number.isFinite(parsedGoalCalories) || parsedGoalCalories <= 0) {
      setError('Vul een geldig caloriedoel in.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        name: name.trim() || undefined,
        age: age ? Number(age) : undefined,
        heightCm: heightCm ? Number(heightCm) : undefined,
        weightKg: weightKg ? Number(weightKg) : undefined,
        dailyCalorieGoal: parsedGoalCalories,
        sport: sport ?? undefined,
        goal: goal ?? undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Naam</Text>
      <TextInput
        style={styles.input}
        placeholder="Je naam"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Leeftijd</Text>
          <TextInput
            style={styles.input}
            placeholder="Jaren"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Lengte (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="cm"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={heightCm}
            onChangeText={setHeightCm}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Gewicht (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="kg"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={weightKg}
            onChangeText={setWeightKg}
          />
        </View>
      </View>

      <Text style={styles.label}>Dagelijks caloriedoel</Text>
      <TextInput
        style={styles.input}
        placeholder="kcal"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={dailyCalorieGoal}
        onChangeText={setDailyCalorieGoal}
      />

      <Text style={styles.label}>Sport</Text>
      <ChipPicker options={SPORT_OPTIONS} value={sport} onChange={setSport} />

      <Text style={styles.label}>Doel</Text>
      <ChipPicker options={GOAL_OPTIONS} value={goal} onChange={setGoal} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Bezig...' : 'Opslaan'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  label: { color: colors.textPrimary, fontWeight: '700', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  error: { color: colors.danger },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
