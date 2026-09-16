import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getUserProfile } from '../../src/firebase/profile';
import { getCachedTodayInsight } from '../../src/firebase/insights';
import { generateWeeklyInsight, type WeeklyInsight } from '../../src/firebase/functions';
import { SPORT_LABELS, GOAL_LABELS } from '../../src/types/workout';
import type { UserProfile } from '../../src/types/profile';
import { colors } from '../../src/theme/colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then(setProfile);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const cached = await getCachedTodayInsight(user.uid);
        if (cached) {
          if (!cancelled) {
            setInsight(cached);
            setInsightLoading(false);
          }
          return;
        }
        const fresh = await generateWeeklyInsight();
        if (!cancelled) setInsight(fresh);
      } catch {
        if (!cancelled) setInsightError(true);
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = [
    { label: 'Leeftijd', value: profile?.age ? `${profile.age} jaar` : undefined },
    { label: 'Lengte', value: profile?.heightCm ? `${profile.heightCm} cm` : undefined },
    { label: 'Gewicht', value: profile?.weightKg ? `${profile.weightKg} kg` : undefined },
    {
      label: 'Caloriedoel',
      value: profile?.dailyCalorieGoal ? `${profile.dailyCalorieGoal} kcal` : undefined,
    },
    { label: 'Sport', value: profile?.sport ? SPORT_LABELS[profile.sport] : undefined },
    { label: 'Doel', value: profile?.goal ? GOAL_LABELS[profile.goal] : undefined },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>
        {profile?.name ? `Hallo, ${profile.name}` : 'Welkom bij StriveGen'}
      </Text>

      {!insightError && (
        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>✨ Jouw weekoverzicht</Text>
          {insightLoading ? (
            <ActivityIndicator color={colors.accentLight} style={{ marginVertical: 8 }} />
          ) : (
            insight && (
              <>
                <Text style={styles.insightMessage}>{insight.message}</Text>
                <View style={styles.insightStatsRow}>
                  <Text style={styles.insightStat}>
                    {insight.stats.daysActive}/7 dagen actief
                  </Text>
                  <Text style={styles.insightStat}>
                    {insight.stats.daysLogged}/7 dagen gelogd
                  </Text>
                  <Text style={styles.insightStat}>
                    {insight.stats.workoutsCompleted} training(en)
                  </Text>
                </View>
              </>
            )
          )}
        </View>
      )}

      <View style={styles.profileCard}>
        <View style={styles.profileCardHeader}>
          <Text style={styles.profileCardTitle}>Jouw profiel</Text>
          <Pressable onPress={() => router.push('/edit-profile')} hitSlop={8}>
            <Text style={styles.editLink}>Bewerken</Text>
          </Pressable>
        </View>

        {stats.map((stat) => (
          <View key={stat.label} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, !stat.value && styles.statValueEmpty]}>
              {stat.value ?? 'Nog niet ingevuld'}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Snel naar</Text>

      <Pressable style={styles.navCard} onPress={() => router.push('/(tabs)/diary')}>
        <Text style={styles.navCardIcon}>📓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.navCardTitle}>Logboek</Text>
          <Text style={styles.navCardSubtitle}>Bekijk of log je voeding van vandaag</Text>
        </View>
      </Pressable>

      <Pressable style={styles.navCard} onPress={() => router.push('/(tabs)/workouts')}>
        <Text style={styles.navCardIcon}>🏋️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.navCardTitle}>Trainingen</Text>
          <Text style={styles.navCardSubtitle}>Kies een training of laat AI er een maken</Text>
        </View>
      </Pressable>

      <Pressable style={styles.navCard} onPress={() => router.push('/(tabs)/settings')}>
        <Text style={styles.navCardIcon}>⚙️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.navCardTitle}>Instellingen</Text>
          <Text style={styles.navCardSubtitle}>Account, profiel en app-info</Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  greeting: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  insightCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 18,
  },
  insightLabel: { color: colors.accentLight, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  insightMessage: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  insightStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  insightStat: { color: colors.textSecondary, fontSize: 12 },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  profileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileCardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  editLink: { color: colors.accentLight, fontWeight: '600', fontSize: 13 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statLabel: { color: colors.textSecondary, fontSize: 14 },
  statValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  statValueEmpty: { color: colors.textMuted, fontWeight: '400', fontStyle: 'italic' },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 4 },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  navCardIcon: { fontSize: 28 },
  navCardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  navCardSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
