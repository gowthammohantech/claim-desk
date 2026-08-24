import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-006 Receipt scanner: camera capture or gallery input. */
export default function ScanScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Scan receipt</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-006 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
