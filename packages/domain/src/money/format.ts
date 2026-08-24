import { PAISE_PER_RUPEE, assertPaise, splitPaise } from './paise.js';

/**
 * INR formatting with the Indian digit grouping (lakh/crore):
 * 1234567.89 renders as "12,34,567.89", not "1,234,567.89".
 *
 * `Intl.NumberFormat('en-IN')` does this correctly on Node and every modern
 * browser. On Hermes (React Native) the bundled ICU data has historically been
 * incomplete for en-IN grouping, so every path here falls back to a hand-rolled
 * grouper. The fallback is unit-tested directly — do not remove it because
 * "Intl works on my simulator".
 */

export interface FormatPaiseOptions {
  /** Include the rupee sign. Default true. */
  symbol?: boolean;
  /** Show paise. Default true. When false, the value is rounded to whole rupees. */
  decimals?: boolean;
}

const RUPEE_SIGN = '\u20B9';

/** Applies Indian grouping (last 3 digits, then pairs) to a digits-only string. */
export function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

function formatFallback(paise: number, symbol: boolean, decimals: boolean): string {
  const rounded = decimals ? paise : Math.round(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
  const parts = splitPaise(rounded);
  const whole = groupIndian(String(parts.rupees));
  const body = decimals ? `${whole}.${String(parts.paise).padStart(2, '0')}` : whole;
  return symbol ? `${RUPEE_SIGN}${body}` : body;
}

/**
 * Formats a paise amount for display.
 *
 * @example formatPaise(123456789) // "₹12,34,567.89"
 * @example formatPaise(2500000, { decimals: false }) // "₹25,000"
 */
export function formatPaise(paise: number, options: FormatPaiseOptions = {}): string {
  assertPaise(paise);
  const { symbol = true, decimals = true } = options;

  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: symbol ? 'currency' : 'decimal',
      currency: 'INR',
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    });
    const output = formatter.format(paise / PAISE_PER_RUPEE);

    // Guard against incomplete ICU data: if the runtime produced Western
    // grouping ("1,234,567") instead of Indian ("12,34,567"), fall back.
    if (paise >= 10_000_00 && /\d,\d{3},\d{3}/.test(output)) {
      return formatFallback(paise, symbol, decimals);
    }
    return output;
  } catch {
    return formatFallback(paise, symbol, decimals);
  }
}

/** Compact form for dense tables: "₹12.3L", "₹1.2Cr". Falls back to full format below a lakh. */
export function formatPaiseCompact(paise: number): string {
  assertPaise(paise);
  const rupees = paise / PAISE_PER_RUPEE;
  if (rupees >= 10_000_000) return `${RUPEE_SIGN}${(rupees / 10_000_000).toFixed(1)}Cr`;
  if (rupees >= 100_000) return `${RUPEE_SIGN}${(rupees / 100_000).toFixed(1)}L`;
  return formatPaise(paise, { decimals: false });
}
