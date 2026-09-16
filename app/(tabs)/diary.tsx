import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeToTodayEntries, deleteFoodEntry } from '../../src/firebase/diary';
import { getUserProfile, updateUserProfile } from '../../src/firebase/profile';
import { signOut } from '../../src/firebase/auth';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '../../src/types/food';
import type { FoodEntry, MealType } from '../../src/types/food';
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

  const sections = MEAL_TYPES.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    entries: entries.filter((entry) => (entry.mealType ?? 'snacks') === type),
  }));

  function openGoalEditor() {
    setGoalInput(String(dailyGoal));
    setEditingGoal(true);
  }

  async function saveGoal() {
    if (!user) return;
    const parsed = Number(goalInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    await updateUserProfile(user.uid, { dailyCalorieGoal: parsed });
    setDailyGoal(parsed);
    setEditingGoal(false);
  }

  function goToAdd(mealType?: MealType) {
    router.push({ pathname: '/(tabs)/add', params: mealType ? { mealType } : {} });
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

      <ScrollView contentContainerStyle={styles.list}>
        {sections.map((section) => {
          const sectionTotal = section.entries.reduce((sum, e) => sum + e.calories, 0);
          return (
            <View key={section.type} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.label}</Text>
                <Text style={styles.sectionTotal}>{sectionTotal} kcal</Text>
              </View>

              {section.entries.length === 0 ? (
                <Text style={styles.sectionEmpty}>Nog niets gelogd.</Text>
              ) : (
                section.entries.map((item) => (
                  <Pressable
                    key={item.id}
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
                ))
              )}

              <Pressable style={styles.sectionAddButton} onPress={() => goToAdd(section.type)}>
                <Ionicons name="add" size={16} color={colors.accentLight} />
                <Text style={styles.sectionAddText}>Snel toevoegen aan {section.label.toLowerCase()}</Text>
              </Pressable>
            </View>
          );
        })}

        <Pressable
          style={styles.signOut}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        >
          <Text style={styles.signOutText}>Uitloggen</Text>
        </Pressable>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => goToAdd()}>
        <Ionicons name="add" size={30} color={colors.white} />
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
  list: { padding: 16, paddingBottom: 100, gap: 20 },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionTotal: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  sectionEmpty: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
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
  sectionAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  sectionAddText: { color: colors.accentLight, fontSize: 13, fontWeight: '600' },
  signOut: { padding: 16, alignItems: 'center' },
  signOutText: { color: colors.danger, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
