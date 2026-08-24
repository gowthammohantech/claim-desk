import { color, gradient } from './color.js';
import { duration, easing } from './motion.js';
import { layout } from './layout.js';
import { radius } from './radius.js';
import { space } from './space.js';
import { fontSize, fontWeight, letterSpacing } from './typography.js';

/**
 * React Native theme.
 *
 * Two conversions happen here and nowhere else:
 *
 *  1. SHADOWS. CSS multi-layer shadows do not exist in RN. Each token collapses
 *     to its dominant layer plus an Android `elevation`. RN's `shadowRadius` is
 *     roughly CSS blur / 2. These are approximations by design.
 *
 *  2. GRADIENT. Converted to the `expo-linear-gradient` prop shape
 *     (colors + locations + start/end), since RN has no CSS gradient syntax.
 */

export interface NativeShadow {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowRadius: number;
  shadowOpacity: number;
  /** Android only — RN ignores shadow* on Android. */
  elevation: number;
}

const SHADOW_COLOR = '#101828';

export const nativeShadow = {
  raised: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  pop: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 20,
    shadowOpacity: 0.12,
    elevation: 8,
  },
  sheet: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: -12 },
    shadowRadius: 20,
    shadowOpacity: 0.18,
    elevation: 16,
  },
} as const satisfies Record<string, NativeShadow>;

/** Ready to spread onto `<LinearGradient {...nativeGradient.accent} />`. */
export const nativeGradient = {
  accent: {
    colors: gradient.accent.stops.map((s) => s.color) as unknown as readonly [
      string,
      string,
      ...string[],
    ],
    locations: gradient.accent.stops.map((s) => s.position) as unknown as readonly [
      number,
      number,
      ...number[],
    ],
    // 135deg in CSS == top-left to bottom-right.
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export const theme = {
  color,
  space,
  radius,
  fontSize,
  fontWeight,
  letterSpacing,
  shadow: nativeShadow,
  gradient: nativeGradient,
  duration,
  easingPoints: easing.standardPoints,
  layout,
} as const;

export type Theme = typeof theme;
