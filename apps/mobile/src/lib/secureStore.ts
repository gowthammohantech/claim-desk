import * as SecureStore from 'expo-secure-store';

/**
 * Credentials live in platform secure storage ONLY (requirements/TDD.md §17.2).
 * Never AsyncStorage, which is plain unencrypted files on device.
 */
const ACCESS_TOKEN_KEY = 'claimdesk.accessToken';
const REFRESH_TOKEN_KEY = 'claimdesk.refreshToken';

export const tokenStore = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
