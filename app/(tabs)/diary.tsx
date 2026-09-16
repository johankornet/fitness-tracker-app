import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import {
  subscribeToTodayEntries,
  deleteFoodEntry,
  getUserProfile,
  updateDailyCalorieGoal,
} from '../../src/firebase/diary';
import { signOut } from '../../src/firebase/auth';
import type { FoodEntry } from '../../src/types/food';
import { colors } from '../../src/theme/colors';

export default function DiaryScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTodayEntries(user.uid, setEntries);
    getUserProfile(user.uid).then((profile) => setDailyGoal(profile.dailyCalorieGoal));
    return unsubscribe;
  }, [user]);

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const remaining = dailyGoal - totalCalories;

  function openGoalEditor() {
    setGoalInput(String(dailyGoal));
    setEditingGoal(true);
  }

  async function saveGoal() {
    if (!user) return;
    const parsed = Number(goalInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    await updateDailyCalorieGoal(user.uid, parsed);
    setDailyGoal(parsed);
    setEditingGoal(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Vandaag</Text>
        <Text style={styles.summaryCalories}>
          {totalCalories} <Text style={styles.summaryCaloriesMuted}>/ {dailyGoal} kcal</Text>
        </Text>
        <Text style={[styles.summaryRemaining, remaining < 0 && styles.summaryRemainingOver]}>
          {remaining >= 0 ? `${remaining} kcal over` : `${-remaining} kcal boven doel`}
        </Text>
        <Pressable onPress={openGoalEditor} hitSlop={8}>
          <Text style={styles.editGoalLink}>Doel aanpassen</Text>
        </Pressable>
      </View>

      <Modal visible={editingGoal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Dagelijks caloriedoel</Text>
            <TextInput
              style={styles.modalInput}
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditingGoal(false)}>
                <Text style={styles.modalCancelText}>Annuleren</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={saveGoal}>
                <Text style={styles.modalSaveText}>Opslaan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nog niets gelogd vandaag. Ga naar "Toevoegen".</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.entryRow}
            onLongPress={() => user && deleteFoodEntry(user.uid, item.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.entryName}>{item.foodName}</Text>
              <Text style={styles.entryMacros}>
                P {item.protein}g · K {item.carbs}g · V {item.fat}g
              </Text>
            </View>
            <Text style={styles.entryCalories}>{item.calories} kcal</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.signOut}
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
      >
        <Text style={styles.signOutText}>Uitloggen</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summary: {
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryCalories: { color: colors.textPrimary, fontSize: 30, fontWeight: '700', marginTop: 4 },
  summaryCaloriesMuted: { color: colors.textSecondary, fontSize: 18, fontWeight: '400' },
  summaryRemaining: { color: colors.success, fontSize: 14, marginTop: 4, fontWeight: '600' },
  summaryRemainingOver: { color: colors.danger },
  editGoalLink: {
    color: colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: colors.textPrimary },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { color: colors.textSecondary, fontWeight: '600' },
  modalSave: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalSaveText: { color: colors.white, fontWeight: '600' },
  list: { padding: 16, gap: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 32 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  entryName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  entryMacros: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  entryCalories: { fontSize: 16, fontWeight: '700', color: colors.accentLight },
  signOut: { padding: 16, alignItems: 'center' },
  signOutText: { color: colors.danger, fontWeight: '600' },
});
