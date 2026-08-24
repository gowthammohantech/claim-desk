/** Strict 4pt spacing scale. Unitless so React Native can use the values directly. */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
} as const;

export type SpaceToken = keyof typeof space;
