import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-009 Mileage expense: origin, destination, distance and rate. */
export default function MileageExpenseScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Mileage expense</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-009 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
