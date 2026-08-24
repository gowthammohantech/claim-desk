import { theme as tokens } from '@claimdesk/tokens/native';

/**
 * The React Native side of the "Clear Ledger" design system.
 *
 * Values come from @claimdesk/tokens — the same source that generates the web
 * Tailwind theme — so the two surfaces cannot drift. See packages/tokens/src/native.ts
 * for the two conversions that happen there (multi-layer CSS shadows collapse
 * to a single RN layer plus an Android elevation, and the CSS gradient becomes
 * expo-linear-gradient props).
 */
export const theme = tokens;

export type Theme = typeof theme;
