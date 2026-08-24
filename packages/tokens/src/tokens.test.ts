import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { color, gradient } from './color.js';
import { layout } from './layout.js';
import { radius } from './radius.js';
import { space } from './space.js';
import { fontSize } from './typography.js';
import { nativeGradient, nativeShadow } from './native.js';

/**
 * Fidelity guard: the prototype's `:root` block is the design source of truth.
 * If someone edits a token here without the design changing, this fails.
 */
const PROTOTYPE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../../reference/ClaimDesk_Mobile_v2.html'),
  'utf8',
);

const cssVar = (name: string): string => {
  const match = PROTOTYPE.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`--${name} not found in the prototype`);
  return match[1].trim();
};

describe('tokens match reference/ClaimDesk_Mobile_v2.html', () => {
  it.each([
    ['paper', color.paper],
    ['paper-raised', color.paperRaised],
    ['paper-sunken', color.paperSunken],
    ['ink', color.ink],
    ['ink-55', color.ink55],
    ['ink-40', color.ink40],
    ['ink-25', color.ink25],
    ['line', color.line],
    ['line-mid', color.lineMid],
    ['accent', color.accent],
    ['accent-deep', color.accentDeep],
    ['accent-tint', color.accentTint],
    ['ok', color.ok],
    ['ok-tint', color.okTint],
    ['warn', color.warn],
    ['warn-tint', color.warnTint],
    ['danger', color.danger],
    ['danger-tint', color.dangerTint],
    ['violet', color.violet],
    ['violet-tint', color.violetTint],
  ])('--%s', (name, value) => {
    expect(cssVar(name)).toBe(value);
  });

  it.each([
    ['sp-1', space[1]],
    ['sp-4', space[4]],
    ['sp-7', space[7]],
    ['r-card', radius.card],
    ['r-input', radius.input],
    ['r-sheet', radius.sheet],
    ['fs-body', fontSize.body],
    ['fs-h1', fontSize.h1],
    ['fs-num-l', fontSize.numL],
    ['tabbar-h', layout.tabBarHeight],
    ['touch', layout.touchTarget],
  ])('--%s is %ipx', (name, value) => {
    expect(cssVar(name)).toBe(`${value}px`);
  });

  it('gradient stops match --accent-grad', () => {
    const css = cssVar('accent-grad');
    for (const stop of gradient.accent.stops) {
      expect(css).toContain(stop.color);
    }
    expect(css).toContain(`${gradient.accent.angleDeg}deg`);
  });
});

describe('native theme conversions', () => {
  it('every shadow token has an Android elevation fallback', () => {
    for (const s of Object.values(nativeShadow)) {
      expect(s.elevation).toBeGreaterThan(0);
      expect(s.shadowOpacity).toBeGreaterThan(0);
    }
  });

  it('sheet shadow casts upward, matching the CSS negative y-offset', () => {
    expect(nativeShadow.sheet.shadowOffset.height).toBeLessThan(0);
  });

  it('gradient colors and locations stay aligned', () => {
    expect(nativeGradient.accent.colors).toHaveLength(
      nativeGradient.accent.locations.length,
    );
    expect(nativeGradient.accent.locations[0]).toBe(0);
    expect(nativeGradient.accent.locations.at(-1)).toBe(1);
  });
});
