/** Corner radii. Unitless. */
export const radius = {
  /** Generic surface radius. */
  base: 14,
  card: 18,
  input: 12,
  pill: 999,
  sheet: 24,
} as const;

export type RadiusToken = keyof typeof radius;
