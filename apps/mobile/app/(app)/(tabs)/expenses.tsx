import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-002 Expenses: unclaimed, draft and in-claim, with multi-select to create a claim. */
export default function ExpensesScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">
          Expenses
        </Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">
          Screen M-002 — see design/02-screen-inventory.md
        </Text>
      </Card>
    </Screen>
  );
}
