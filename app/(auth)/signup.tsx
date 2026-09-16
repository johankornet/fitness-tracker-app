import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Link, router } from 'expo-router';
import { signUp } from '../../src/firebase/auth';
import { BrandHeader } from '../../src/components/BrandHeader';
import { colors } from '../../src/theme/colors';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password);
      router.replace('/(tabs)/diary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registreren mislukt');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <BrandHeader />

      <TextInput
        style={styles.input}
        placeholder="E-mailadres"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Wachtwoord (min. 6 tekens)"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Bezig...' : 'Registreren'}</Text>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        Heb je al een account? Inloggen
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: colors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  error: { color: colors.danger },
  link: { marginTop: 16, textAlign: 'center', color: colors.accentLight },
});
