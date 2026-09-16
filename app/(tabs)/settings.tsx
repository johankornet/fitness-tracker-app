import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { signOut } from '../../src/firebase/auth';
import { colors } from '../../src/theme/colors';

export default function SettingsScreen() {
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>E-mailadres</Text>
          <Text style={styles.rowValue}>{user?.email}</Text>
        </View>
        <Pressable style={styles.rowButton} onPress={() => router.push('/change-password')}>
          <Text style={styles.rowButtonText}>Wachtwoord wijzigen</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable style={styles.rowButton} onPress={handleSignOut}>
          <Text style={[styles.rowButtonText, styles.signOutText]}>Uitloggen</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Doelen & profiel</Text>
      <View style={styles.card}>
        <Pressable style={styles.rowButton} onPress={() => router.push('/edit-profile')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowButtonText}>Profiel bewerken</Text>
            <Text style={styles.rowHint}>
              Naam, leeftijd, lengte, gewicht, sport, doel en caloriedoel
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
      <Text style={styles.footnote}>
        Wijzigingen hier worden direct overal in de app bijgewerkt (Home, Dagboek en Trainingen
        lezen steeds dezelfde gegevens).
      </Text>

      <Text style={styles.sectionTitle}>Over</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App</Text>
          <Text style={styles.rowValue}>StriveGen</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Versie</Text>
          <Text style={styles.rowValue}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textSecondary, fontSize: 14 },
  rowValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  rowButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowButtonText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  rowHint: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 18 },
  signOutText: { color: colors.danger },
  footnote: { color: colors.textMuted, fontSize: 12, marginTop: 8, paddingHorizontal: 4 },
});
