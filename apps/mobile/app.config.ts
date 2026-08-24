import type { ExpoConfig } from 'expo/config';

/**
 * The `scheme` is load-bearing: push notifications must deep-link to a claim or
 * an approval (requirements/03-FRD.md FR-NOT-003), so `claimdesk://claim/:id`
 * and `claimdesk://approval/:id` have to resolve from a cold start.
 */
const config: ExpoConfig = {
  name: 'ClaimDesk',
  slug: 'claimdesk',
  scheme: 'claimdesk',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.claimdesk.app',
    infoPlist: {
      NSCameraUsageDescription:
        'ClaimDesk uses the camera to capture receipts for your expense claims.',
      NSPhotoLibraryUsageDescription:
        'ClaimDesk lets you attach receipt images from your photo library.',
    },
  },

  android: {
    package: 'com.claimdesk.app',
    adaptiveIcon: { backgroundColor: '#2D5FF0' },
  },

  plugins: ['expo-router', 'expo-secure-store', 'expo-status-bar', 'expo-splash-screen'],

  experiments: { typedRoutes: true },

  extra: {
    apiBaseUrl: process.env['EXPO_PUBLIC_API_BASE_URL'] ?? 'http://localhost:4000/v1',
  },
};

export default config;
