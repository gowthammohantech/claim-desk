import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-013 Approval detail with approve, return and reject. Deep-link target for push notifications. */
export default function ApprovalDetailScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Approval detail</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-013 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
