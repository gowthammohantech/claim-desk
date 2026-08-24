import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

/** Mobile number entry — step 1 of OTP sign-in (ADR-007, gaps.md GAP-002). */
export default function PhoneScreen() {
  return (
    <Screen>
      <Text variant="h1" weight="extrabold">
        Sign in
      </Text>
      <Card>
        <Text tone="muted">
          Mobile number + OTP. OTP delivery uses a dummy adapter until an SMS provider
          is selected (design/11-integration-spec.md §2).
        </Text>
      </Card>
    </Screen>
  );
}
