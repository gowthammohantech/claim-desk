import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-008 Manual expense entry. */
export default function ManualExpenseScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Manual expense</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-008 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
