import { formatPaise } from '@claimdesk/domain';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useSession } from '@/lib/session';
import { theme } from '@/theme/theme';

/**
 * M-001 Home.
 *
 * Renders the hero card from the prototype so the "Clear Ledger" gradient,
 * shadows and type scale are exercised on device from day one — if the shared
 * token pipeline breaks, this screen shows it immediately.
 */
export default function HomeScreen() {
  const { actor, isApprover } = useSession();

  return (
    <Screen>
      <LinearGradient {...theme.gradient.accent} style={styles.hero}>
        <Text variant="caption" tone="onAccent" weight="semibold" style={styles.eyebrow}>
          UNCLAIMED
        </Text>
        <Text variant="numL" tone="onAccent" weight="extrabold" numeric>
          {formatPaise(1_234_567)}
        </Text>
        <Text variant="bodyS" tone="onAccent">
          5 expenses ready to claim
        </Text>
      </LinearGradient>

      <Card>
        <Text variant="title" weight="bold">
          {actor.employeeId}
        </Text>
        <Text tone="muted">
          Roles: {actor.roles.join(', ')}
          {isApprover ? ' — the Approvals tab is visible' : ''}
        </Text>
      </Card>

      <View style={styles.note}>
        <Text variant="caption" tone="faint">
          Screen M-001 — see design/02-screen-inventory.md
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: theme.radius.card,
    padding: theme.space[5],
    gap: theme.space[1],
    ...theme.shadow.pop,
  },
  eyebrow: { letterSpacing: 1 },
  note: { alignItems: 'center', paddingTop: theme.space[2] },
});
