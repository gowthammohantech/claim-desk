import { Tabs } from 'expo-router';

import { useSession } from '@/lib/session';
import { theme } from '@/theme/theme';

/**
 * The five-tab shell from design/02-screen-inventory.md §3 and
 * design/01-HFD.md §4:
 *
 *   Home | Expenses | Claims | Approvals | Profile
 *
 * The mobile app is dual-persona in ONE binary — Employee and Approver — so the
 * Approvals tab is rendered only for holders of `approval:read:assigned`.
 * `href: null` hides the tab while keeping the route reachable, which matters
 * because a push notification can deep-link straight to an approval.
 *
 * (requirements/TDD.md §17.1 sketches a different layout with a centre
 * "+ Capture" button. The design pack is newer and supersedes it.)
 */
export default function TabsLayout() {
  const { isApprover } = useSession();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: theme.color.ink40,
        tabBarStyle: {
          height: theme.layout.tabBarHeight,
          backgroundColor: theme.color.paperRaised,
          borderTopColor: theme.color.line,
        },
        tabBarLabelStyle: { fontSize: theme.fontSize.micro, fontWeight: theme.fontWeight.medium },
        headerStyle: { backgroundColor: theme.color.paperRaised },
        headerTintColor: theme.color.ink,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Tabs.Screen name="claims" options={{ title: 'Claims' }} />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          href: isApprover ? '/(app)/(tabs)/approvals' : null,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
