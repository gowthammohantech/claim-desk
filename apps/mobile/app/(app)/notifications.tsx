import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-014 In-app notification list. Push is the only delivery channel in scope (gaps.md GAP-008). */
export default function NotificationsScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Notifications</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-014 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
