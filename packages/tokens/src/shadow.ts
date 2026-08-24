/**
 * Elevation. Web keeps the exact multi-layer CSS shadows; `native.ts` collapses
 * each to a single RN layer plus an Android `elevation` — RN has no multi-layer
 * shadow primitive, so the native values are a documented approximation, not a
 * translation. Do not "fix" the mismatch by changing these CSS values.
 */
export const shadow = {
  raised: '0 1px 2px rgba(16,24,40,.04), 0 6px 20px rgba(16,24,40,.06)',
  pop: '0 4px 10px rgba(16,24,40,.08), 0 16px 40px rgba(16,24,40,.12)',
  sheet: '0 -12px 40px rgba(16,24,40,.18)',
} as const;

export type ShadowToken = keyof typeof shadow;
