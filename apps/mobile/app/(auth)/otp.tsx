import { Screen } from '@/components/ui/Screen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

/** OTP verification — step 2. Exchanges the code for access + refresh tokens. */
export default function OtpScreen() {
  return (
    <Screen>
      <Text variant="h1" weight="extrabold">
        Enter the code
      </Text>
      <Card>
        <Text tone="muted">Six-digit code. Not implemented yet.</Text>
      </Card>
    </Screen>
  );
}
