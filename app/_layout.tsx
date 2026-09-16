import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/context/AuthContext';
import { colors } from '../src/theme/colors';

const modalHeaderOptions = {
  presentation: 'modal' as const,
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scanner" options={{ ...modalHeaderOptions, title: 'Scan barcode' }} />
          <Stack.Screen
            name="photo-scan"
            options={{ ...modalHeaderOptions, title: 'Foto van maaltijd' }}
          />
          <Stack.Screen
            name="workout-detail"
            options={{ ...modalHeaderOptions, title: 'Training' }}
          />
          <Stack.Screen
            name="ai-workout"
            options={{ ...modalHeaderOptions, title: 'AI-training' }}
          />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
