import { Redirect } from 'expo-router';

/**
 * Entry redirect. Once the auth module lands this becomes a session check that
 * sends unauthenticated users to `(auth)/phone` instead.
 */
export default function Index() {
  return <Redirect href="/(app)/(tabs)" />;
}
