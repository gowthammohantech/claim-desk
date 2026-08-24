export const easing = {
  standard: 'cubic-bezier(.32,.72,.24,1)',
  /** Same curve as control points, for React Native `Easing.bezier(...)`. */
  standardPoints: [0.32, 0.72, 0.24, 1],
} as const;

export const duration = {
  fast: 140,
  medium: 220,
  sheet: 300,
} as const;
