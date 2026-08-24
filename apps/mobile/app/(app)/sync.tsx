import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';

/** M-020 Offline and sync state: local drafts, pending uploads, retry. Offline-assisted only — submit, approve, verify and pay always require the server (TDD §17.3). */
export default function SyncScreen() {
  return (
    <Screen>
      <Card>
        <Text variant="title" weight="bold">Offline and sync</Text>
        <Text tone="muted">Not implemented yet.</Text>
        <Text variant="caption" tone="faint">Screen M-020 — see design/02-screen-inventory.md</Text>
      </Card>
    </Screen>
  );
}
