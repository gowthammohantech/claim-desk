import { createClaimDeskClient } from '@claimdesk/api-client';
import Constants from 'expo-constants';

import { tokenStore } from './secureStore';

const baseUrl =
  (Constants.expoConfig?.extra?.['apiBaseUrl'] as string | undefined) ??
  'http://localhost:4000/v1';

export const api = createClaimDeskClient({
  baseUrl,
  tokens: { getAccessToken: () => tokenStore.getAccessToken() },
});
