import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { addFoodEntry } from '../../src/firebase/diary';
import { MEAL_TYPES, MEAL_TYPE_LABELS, suggestMealTypeForNow } from '../../src/types/food';
import type { MealType } from '../../src/types/food';
import { ChipPicker } from '../../src/components/ChipPicker';
import { colors } from '../../src/theme/colors';

const MEAL_TYPE_OPTIONS = MEAL_TYPES.map((value) => ({ value, label: MEAL_TYPE_LABELS[value] }));

export default function AddScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    name?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    barcode?: string;
    photoConfidence?: string;
    mealType?: string;
  }>();

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [barcode, setBarcode] = useState<string | undefined>(undefined);
  const [photoConfidence, setPhotoConfidence] = useState<string | undefined>(undefined);
  const [mealType, setMealType] = useState<MealType>(suggestMealTypeForNow());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.name) setFoodName(params.name);
    if (params.calories) setCalories(params.calories);
    if (params.protein) setProtein(params.protein);
    if (params.carbs) setCarbs(params.carbs);
    if (params.fat) setFat(params.fat);
    if (params.barcode) setBarcode(params.barcode);
    if (params.photoConfidence) setPhotoConfidence(params.photoConfidence);
    if (params.mealType && MEAL_TYPES.includes(params.mealType as MealType)) {
      setMealType(params.mealType as MealType);
    }
  }, [
    params.name,
    params.calories,
    params.protein,
    params.carbs,
    params.fat,
    params.barcode,
    params.photoConfidence,
    params.mealType,
  ]);

  function resetForm() {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setBarcode(undefined);
    setPhotoConfidence(undefined);
    setMealType(suggestMealTypeForNow());
    router.setParams({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      barcode: '',
      photoConfidence: '',
      mealType: '',
    });
  }

  async function handleSave() {
    if (!user) return;
    setError(null);

    const parsedCalories = Number(calories);
    if (!foodName.trim() || Number.isNaN(parsedCalories) || parsedCalories < 0) {
      setError('Vul een naam en een geldig aantal calorieën in.');
      return;
    }

    setSaving(true);
    try {
      await addFoodEntry(user.uid, {
        foodName: foodName.trim(),
        calories: parsedCalories,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        servingQty: 1,
        mealType,
        source: barcode ? 'barcode' : photoConfidence ? 'photo' : 'manual',
        ...(barcode ? { barcode } : {}),
      });
      resetForm();
      router.push('/(tabs)/diary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Maaltijd</Text>
      <ChipPicker
        options={MEAL_TYPE_OPTIONS}
        value={mealType}
        onChange={(v) => v && setMealType(v)}
        compact
        fill
      />

      <View style={styles.scanRow}>
        <Pressable
          style={[styles.scanButton, styles.scanButtonHalf]}
          onPress={() => router.push('/scanner')}
        >
          <Text style={styles.scanButtonText}>📷 Scan barcode</Text>
        </Pressable>
        <Pressable
          style={[styles.scanButton, styles.scanButtonHalf]}
          onPress={() => router.push('/photo-scan')}
        >
          <Text style={styles.scanButtonText}>📸 Foto van maaltijd</Text>
        </Pressable>
      </View>

      <Text style={styles.orText}>— of vul handmatig in —</Text>

      {barcode && <Text style={styles.barcodeTag}>Barcode: {barcode}</Text>}
      {photoConfidence && (
        <Text style={styles.barcodeTag}>
          AI-schatting op basis van foto (zekerheid: {photoConfidence})
        </Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Naam voedingsmiddel"
        placeholderTextColor={colors.textMuted}
        value={foodName}
        onChangeText={setFoodName}
      />
      <TextInput
        style={styles.input}
        placeholder="Calorieën (kcal)"
        placeholderTextColor={colors.textMuted}
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.macroInput]}
          placeholder="Eiwit (g)"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={protein}
          onChangeText={setProtein}
        />
        <TextInput
          style={[styles.input, styles.macroInput]}
          placeholder="Koolh. (g)"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={carbs}
          onChangeText={setCarbs}
        />
        <TextInput
          style={[styles.input, styles.macroInput]}
          placeholder="Vet (g)"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={fat}
          onChangeText={setFat}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Bezig...' : 'Toevoegen aan dagboek'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 12, backgroundColor: colors.background, flexGrow: 1 },
  label: { color: colors.textPrimary, fontWeight: '700' },
  scanRow: { flexDirection: 'row', gap: 8 },
  scanButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  scanButtonHalf: { flex: 1 },
  scanButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  orText: { textAlign: 'center', color: colors.textMuted, marginVertical: 4 },
  barcodeTag: { textAlign: 'center', color: colors.accentLight, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 8 },
  macroInput: { flex: 1 },
  error: { color: colors.danger },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
