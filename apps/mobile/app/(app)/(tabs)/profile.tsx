import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-015 Profile: identity, grade, department, branch, manager, masked payment profile. */
export default function ProfileScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">
          Profile
        </Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">
          Screen M-015 — see design/02-screen-inventory.md
        </Text>
      </Card>
    </Screen>
  );
}
