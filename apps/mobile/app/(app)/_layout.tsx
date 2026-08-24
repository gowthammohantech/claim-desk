import { Stack } from 'expo-router';

/**
 * Authenticated area. Secondary screens are stack routes off the tab shell
 * (design/01-HFD.md §4).
 */
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="sync" options={{ title: 'Offline & sync' }} />
    </Stack>
  );
}
