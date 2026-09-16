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
import { FastingCard } from '../../src/components/FastingCard';
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
  const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const totalFat = entries.reduce((sum, entry) => sum + entry.fat, 0);
  const remaining = dailyGoal - totalCalories;
  const progressPercent = Math.min(100, Math.max(0, (totalCalories / dailyGoal) * 100));

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
        <View style={styles.todayCard}>
          <View style={styles.todayHeaderRow}>
            <Text style={styles.todayLabel}>VANDAAG</Text>
            <Pressable onPress={openGoalEditor} hitSlop={8}>
              <Text style={styles.editGoalLink}>Doel aanpassen</Text>
            </Pressable>
          </View>

          <View style={styles.caloriesRow}>
            <Text style={styles.caloriesValue}>{totalCalories}</Text>
            <Text style={styles.caloriesGoal}>/ {dailyGoal} kcal</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={[styles.remainingText, remaining < 0 && styles.remainingOver]}>
            {remaining >= 0 ? `${remaining} kcal over` : `${-remaining} kcal boven doel`}
          </Text>

          <View style={styles.divider} />

          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totalProtein}g</Text>
              <Text style={styles.macroLabel}>Eiwit</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totalCarbs}g</Text>
              <Text style={styles.macroLabel}>Koolhydraten</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totalFat}g</Text>
              <Text style={styles.macroLabel}>Vet</Text>
            </View>
          </View>
        </View>

        {sections.map((section) => {
          const sectionTotal = section.entries.reduce((sum, e) => sum + e.calories, 0);
          return (
            <View key={section.type} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="restaurant-outline" size={15} color={colors.accent} />
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                </View>
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

        <FastingCard />

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

  todayCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
  },
  todayHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  todayLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  caloriesRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  caloriesValue: { color: colors.textPrimary, fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  caloriesGoal: { color: colors.textMuted, fontSize: 16 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  remainingText: { color: colors.success, fontSize: 13, fontWeight: '600', marginTop: 8 },
  remainingOver: { color: colors.danger },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center', flex: 1 },
  macroValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  macroLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },

  editGoalLink: { color: colors.accentLight, fontSize: 13, fontWeight: '600' },

  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  sectionTotal: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  sectionEmpty: { color: colors.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
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
