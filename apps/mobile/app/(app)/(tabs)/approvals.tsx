import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-012 Approvals inbox: assigned pending tasks, age and exception indicators. */
export default function ApprovalsScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">
          Approvals
        </Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">
          Screen M-012 — see design/02-screen-inventory.md
        </Text>
      </Card>
    </Screen>
  );
}
