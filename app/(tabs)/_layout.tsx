import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen name="diary" options={{ title: 'Dagboek' }} />
      <Tabs.Screen name="add" options={{ title: 'Toevoegen' }} />
    </Tabs>
  );
}
