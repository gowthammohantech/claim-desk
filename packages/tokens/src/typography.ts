/**
 * Type scale. Deliberately non-integer at the small end (10.5 / 11.5 / 14.5) —
 * that is what the prototype specifies.
 *
 * Caveat for React Native: Android rounds fractional `fontSize` inconsistently
 * across densities. Verify `body` (14.5) on a low-DPI Android before relying on
 * it; if it reads badly, snap the native scale to whole pixels in `native.ts`
 * rather than changing this file.
 */
export const fontSize = {
  micro: 10.5,
  caption: 11.5,
  bodyS: 13,
  body: 14.5,
  title: 17,
  h2: 21,
  h1: 26,
  numL: 38,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const fontFamily = {
  ui: "'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif",
  /** The prototype aliases display to the UI family. */
  display: "'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif",
} as const;

export const letterSpacing = {
  /** Uppercase eyebrow tracking. */
  caps: '0.07em',
  h1: '-0.03em',
  h2: '-0.02em',
} as const;

export type FontSizeToken = keyof typeof fontSize;
