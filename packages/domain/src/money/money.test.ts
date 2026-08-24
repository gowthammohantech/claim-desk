import { describe, expect, it, vi } from 'vitest';

import { formatPaise, formatPaiseCompact, groupIndian } from './format.js';
import { computeMileagePaise } from './mileage.js';
import {
  MAX_AMOUNT_PAISE,
  MoneyError,
  isValidPaise,
  roundHalfUp,
  splitPaise,
  sumPaise,
  toPaise,
  toRupees,
} from './paise.js';

describe('paise arithmetic', () => {
  it('accepts non-negative integers within range', () => {
    expect(isValidPaise(0)).toBe(true);
    expect(isValidPaise(2_500_000)).toBe(true);
    expect(isValidPaise(MAX_AMOUNT_PAISE)).toBe(true);
  });

  it('rejects floats, negatives, over-range and non-numbers', () => {
    expect(isValidPaise(10.5)).toBe(false);
    expect(isValidPaise(-1)).toBe(false);
    expect(isValidPaise(MAX_AMOUNT_PAISE + 1)).toBe(false);
    expect(isValidPaise('100')).toBe(false);
    expect(isValidPaise(Number.NaN)).toBe(false);
  });

  it('converts rupees to paise without binary-float drift', () => {
    // 19.99 * 100 === 1998.9999999999998 in IEEE-754. Truncating loses a paise.
    expect(toPaise(19.99)).toBe(1999);
    expect(toPaise(0.07)).toBe(7);
    expect(toPaise(1234.56)).toBe(123456);
    expect(toPaise(0)).toBe(0);
  });

  it('rounds half away from zero', () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-2.5)).toBe(-3);
    expect(roundHalfUp(2.4)).toBe(2);
  });

  it('sums and splits', () => {
    expect(sumPaise([100, 250, 1])).toBe(351);
    expect(sumPaise([])).toBe(0);
    expect(splitPaise(123456)).toEqual({ rupees: 1234, paise: 56 });
  });

  it('throws on invalid input rather than coercing', () => {
    expect(() => sumPaise([100, 10.5])).toThrow(MoneyError);
    expect(() => toRupees(-5)).toThrow(MoneyError);
    expect(() => toPaise(Number.POSITIVE_INFINITY)).toThrow(MoneyError);
  });
});

describe('formatPaise — Indian digit grouping', () => {
  it('groups lakh/crore, not thousands', () => {
    expect(formatPaise(123456789)).toBe('\u20B912,34,567.89');
    expect(formatPaise(2500000)).toBe('\u20B925,000.00');
    expect(formatPaise(100)).toBe('\u20B91.00');
    expect(formatPaise(0)).toBe('\u20B90.00');
  });

  it('honours the symbol and decimals options', () => {
    expect(formatPaise(2500000, { decimals: false })).toBe('\u20B925,000');
    expect(formatPaise(2500000, { symbol: false })).toBe('25,000.00');
  });

  it('groups correctly in the hand-rolled fallback', () => {
    expect(groupIndian('1234567')).toBe('12,34,567');
    expect(groupIndian('123')).toBe('123');
    expect(groupIndian('1234')).toBe('1,234');
    expect(groupIndian('100000000')).toBe('10,00,00,000');
  });

  it('falls back when the runtime has no usable Intl (Hermes/Android ICU)', () => {
    const original = globalThis.Intl;
    // Simulate a runtime whose NumberFormat throws — the documented Hermes risk.
    vi.stubGlobal('Intl', {
      NumberFormat: class {
        constructor() {
          throw new Error('no ICU data');
        }
      },
    });
    try {
      expect(formatPaise(123456789)).toBe('\u20B912,34,567.89');
      expect(formatPaise(2500000, { decimals: false })).toBe('\u20B925,000');
    } finally {
      vi.stubGlobal('Intl', original);
    }
  });

  it('falls back when the runtime emits Western grouping', () => {
    const original = globalThis.Intl;
    vi.stubGlobal('Intl', {
      NumberFormat: class {
        format(n: number) {
          // en-US style grouping, which en-IN must never produce.
          return `\u20B9${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        }
      },
    });
    try {
      expect(formatPaise(123456789)).toBe('\u20B912,34,567.89');
    } finally {
      vi.stubGlobal('Intl', original);
    }
  });

  it('formats compactly for dense tables', () => {
    expect(formatPaiseCompact(123456789)).toBe('\u20B912.3L');
    expect(formatPaiseCompact(1234567890)).toBe('\u20B91.2Cr');
    expect(formatPaiseCompact(250000)).toBe('\u20B92,500');
  });
});

describe('mileage', () => {
  it('multiplies distance by rate and rounds to whole paise', () => {
    expect(computeMileagePaise({ distanceKm: 12.5, ratePaisePerKm: 1200 })).toBe(15000);
    expect(computeMileagePaise({ distanceKm: 0, ratePaisePerKm: 1200 })).toBe(0);
    // 10.005 * 1200 = 12006.000000000002 -> must not drift upward
    expect(computeMileagePaise({ distanceKm: 10.005, ratePaisePerKm: 1200 })).toBe(12006);
  });

  it('rejects negative or absurd distances', () => {
    expect(() => computeMileagePaise({ distanceKm: -1, ratePaisePerKm: 1200 })).toThrow(MoneyError);
    expect(() => computeMileagePaise({ distanceKm: 1e9, ratePaisePerKm: 1200 })).toThrow(MoneyError);
  });

  it('rejects a non-integer rate', () => {
    expect(() => computeMileagePaise({ distanceKm: 10, ratePaisePerKm: 12.5 })).toThrow(MoneyError);
  });
});
