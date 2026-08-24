/** Supported currencies. INR only (gaps.md GAP-019, ADR-010). */
export const Currency = {
  INR: 'INR',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const CURRENCIES = Object.values(Currency) as readonly Currency[];
