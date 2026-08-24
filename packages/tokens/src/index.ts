/**
 * "Clear Ledger" design tokens — the single source of truth for both surfaces.
 *
 *   src/*.ts  (this package, plain TS values)
 *      ├─ scripts/build-css.ts -> dist/tokens.css   (:root custom properties)
 *      │                       -> dist/tailwind.css (@theme block)   -> apps/web
 *      └─ src/native.ts                                              -> apps/mobile
 *
 * React Native cannot consume Tailwind, so the shared artifact is the token
 * object, not the styling mechanism.
 */
export { avatarPalette, color, gradient, type ColorToken } from './color.js';
export { space, type SpaceToken } from './space.js';
export { radius, type RadiusToken } from './radius.js';
export {
  fontFamily,
  fontSize,
  fontWeight,
  letterSpacing,
  type FontSizeToken,
} from './typography.js';
export { shadow, type ShadowToken } from './shadow.js';
export { duration, easing } from './motion.js';
export { layout } from './layout.js';
