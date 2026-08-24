import { createClaimDeskClient } from '@claimdesk/api-client';

/**
 * The access token is held in memory only — never localStorage, which is
 * readable by any injected script. A refresh call re-establishes it on reload.
 */
let accessToken: string | null = null;

export const tokenStore = {
  set(token: string | null): void {
    accessToken = token;
  },
  getAccessToken(): string | null {
    return accessToken;
  },
};

const baseUrl = import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:4000/v1';

export const api = createClaimDeskClient({
  baseUrl,
  tokens: { getAccessToken: () => tokenStore.getAccessToken() },
});
