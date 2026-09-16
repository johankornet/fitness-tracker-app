import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { subscribeToLastEntryTimestamp } from '../firebase/diary';
import { subscribeToManualFastStart, startFastNow } from '../firebase/fasting';
import { getFastingMilestone } from '../data/fastingMilestones';
import { colors } from '../theme/colors';

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}u ${minutes}m`;
}

export function FastingCard() {
  const { user } = useAuth();
  const [lastEntryAt, setLastEntryAt] = useState<number | null>(null);
  const [manualStartAt, setManualStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!user) return;
    const unsubEntry = subscribeToLastEntryTimestamp(user.uid, setLastEntryAt);
    const unsubManual = subscribeToManualFastStart(user.uid, setManualStartAt);
    return () => {
      unsubEntry();
      unsubManual();
    };
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fastStartedAt = Math.max(lastEntryAt ?? 0, manualStartAt ?? 0) || null;

  if (!fastStartedAt) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Vasten</Text>
        <Text style={styles.hint}>
          Log een maaltijd of start handmatig om je vastentijd bij te houden.
        </Text>
        <Pressable style={styles.startButton} onPress={() => user && startFastNow(user.uid)}>
          <Text style={styles.startButtonText}>Start vasten</Text>
        </Pressable>
      </View>
    );
  }

  const elapsedMs = Math.max(0, now - fastStartedAt);
  const elapsedHours = elapsedMs / 3600000;
  const milestone = getFastingMilestone(elapsedHours);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Vasten</Text>
        <Pressable onPress={() => user && startFastNow(user.uid)} hitSlop={8}>
          <Text style={styles.restartLink}>Start vasten</Text>
        </Pressable>
      </View>

      <Text style={styles.duration}>{formatDuration(elapsedMs)}</Text>

      <View style={styles.milestoneTag}>
        <Text style={styles.milestoneLabel}>{milestone.label}</Text>
      </View>
      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
      <Text style={styles.disclaimer}>
        Algemene informatie, geen medisch advies.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    margin: 16,
    marginBottom: 0,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  restartLink: { color: colors.accentLight, fontSize: 13, fontWeight: '600' },
  hint: { color: colors.textSecondary, fontSize: 13, marginTop: 8, marginBottom: 14 },
  startButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  startButtonText: { color: colors.white, fontWeight: '700' },
  duration: { color: colors.accentLight, fontSize: 32, fontWeight: '700', marginTop: 8 },
  milestoneTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 12,
  },
  milestoneLabel: { color: colors.accentLight, fontSize: 12, fontWeight: '700' },
  milestoneDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 8 },
  disclaimer: { color: colors.textMuted, fontSize: 11, marginTop: 8, fontStyle: 'italic' },
});
