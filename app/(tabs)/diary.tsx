import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { subscribeToTodayEntries, deleteFoodEntry, getUserProfile } from '../../src/firebase/diary';
import { signOut } from '../../src/firebase/auth';
import type { FoodEntry } from '../../src/types/food';

export default function DiaryScreen() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2000);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToTodayEntries(user.uid, setEntries);
    getUserProfile(user.uid).then((profile) => setDailyGoal(profile.dailyCalorieGoal));
    return unsubscribe;
  }, [user]);

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const remaining = dailyGoal - totalCalories;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Vandaag</Text>
        <Text style={styles.summaryCalories}>
          {totalCalories} / {dailyGoal} kcal
        </Text>
        <Text style={styles.summaryRemaining}>
          {remaining >= 0 ? `${remaining} kcal over` : `${-remaining} kcal boven doel`}
        </Text>
      </View>

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
  container: { flex: 1 },
  summary: {
    padding: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  summaryLabel: { color: '#dbeafe', fontSize: 14 },
  summaryCalories: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  summaryRemaining: { color: '#dbeafe', fontSize: 14, marginTop: 4 },
  list: { padding: 16, gap: 8 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 32 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  entryName: { fontSize: 16, fontWeight: '600' },
  entryMacros: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  entryCalories: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  signOut: { padding: 16, alignItems: 'center' },
  signOutText: { color: '#dc2626', fontWeight: '600' },
});
