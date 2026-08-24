import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-004 Claims list with status and current approval stage. */
export default function ClaimsScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">
          Claims
        </Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">
          Screen M-004 — see design/02-screen-inventory.md
        </Text>
      </Card>
    </Screen>
  );
}
