import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (newPassword.length < 6) {
      setError('Nieuw wachtwoord moet minimaal 6 tekens zijn.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Nieuwe wachtwoorden komen niet overeen.');
      return;
    }
    if (!user || !user.email) return;

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err instanceof Error ? 'Huidig wachtwoord onjuist of iets anders ging mis.' : 'Onbekende fout.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Huidig wachtwoord</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <Text style={styles.label}>Nieuw wachtwoord</Text>
      <TextInput
        style={styles.input}
        placeholder="Min. 6 tekens"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.label}>Bevestig nieuw wachtwoord</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {success && <Text style={styles.success}>Wachtwoord gewijzigd.</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Bezig...' : 'Wachtwoord wijzigen'}</Text>
      </Pressable>

      <Pressable style={styles.doneButton} onPress={() => router.back()}>
        <Text style={styles.doneButtonText}>Klaar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 10 },
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
  error: { color: colors.danger },
  success: { color: colors.success },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  doneButton: { padding: 14, alignItems: 'center' },
  doneButtonText: { color: colors.accentLight, fontWeight: '600' },
});
