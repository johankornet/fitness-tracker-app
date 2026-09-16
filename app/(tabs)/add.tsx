import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { addFoodEntry } from '../../src/firebase/diary';

export default function AddScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    name?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    barcode?: string;
  }>();

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [barcode, setBarcode] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.name) setFoodName(params.name);
    if (params.calories) setCalories(params.calories);
    if (params.protein) setProtein(params.protein);
    if (params.carbs) setCarbs(params.carbs);
    if (params.fat) setFat(params.fat);
    if (params.barcode) setBarcode(params.barcode);
  }, [params.name, params.calories, params.protein, params.carbs, params.fat, params.barcode]);

  function resetForm() {
    setFoodName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setBarcode(undefined);
    router.setParams({ name: '', calories: '', protein: '', carbs: '', fat: '', barcode: '' });
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
        source: barcode ? 'barcode' : 'manual',
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
      <Pressable style={styles.scanButton} onPress={() => router.push('/scanner')}>
        <Text style={styles.scanButtonText}>📷 Scan barcode</Text>
      </Pressable>

      <Text style={styles.orText}>— of vul handmatig in —</Text>

      {barcode && <Text style={styles.barcodeTag}>Barcode: {barcode}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Naam voedingsmiddel"
        value={foodName}
        onChangeText={setFoodName}
      />
      <TextInput
        style={styles.input}
        placeholder="Calorieën (kcal)"
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.macroInput]}
          placeholder="Eiwit (g)"
          keyboardType="numeric"
          value={protein}
          onChangeText={setProtein}
        />
        <TextInput
          style={[styles.input, styles.macroInput]}
          placeholder="Koolh. (g)"
          keyboardType="numeric"
          value={carbs}
          onChangeText={setCarbs}
        />
        <TextInput
          style={[styles.input, styles.macroInput]}
          placeholder="Vet (g)"
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
  container: { padding: 20, gap: 12 },
  scanButton: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  orText: { textAlign: 'center', color: '#6b7280', marginVertical: 4 },
  barcodeTag: { textAlign: 'center', color: '#2563eb', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 8 },
  macroInput: { flex: 1 },
  error: { color: '#dc2626' },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
