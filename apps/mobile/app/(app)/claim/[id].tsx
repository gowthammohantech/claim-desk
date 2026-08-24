import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-005 Claim detail: header, lines, engagement, status timeline, payment. Deep-link target for push notifications. */
export default function ClaimDetailScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Claim detail</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-005 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
