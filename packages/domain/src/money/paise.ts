/**
 * All money in ClaimDesk is an INTEGER number of paise (ADR-010, gaps.md
 * GAP-019). There are no floats and no decimals anywhere in the domain, the
 * API, or the database. INR is the only currency.
 *
 * The API field is always `amountPaise` / `totalPaise` / `ratePaisePerKm`.
 */

/** Paise in one rupee. */
export const PAISE_PER_RUPEE = 100;

/**
 * Largest amount we accept. `Number.MAX_SAFE_INTEGER` paise is absurdly large;
 * this cap keeps values inside a range that is safe to sum without overflow and
 * obviously wrong if exceeded (~Rs 1,000 crore).
 */
export const MAX_AMOUNT_PAISE = 100_000_000_000;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** True when `value` is a non-negative safe integer within the accepted range. */
export function isValidPaise(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_AMOUNT_PAISE
  );
}

/** Throws unless `value` is a valid paise amount. */
export function assertPaise(value: unknown, label = 'amount'): asserts value is number {
  if (!isValidPaise(value)) {
    throw new MoneyError(
      `${label} must be a non-negative integer number of paise <= ${MAX_AMOUNT_PAISE}, received: ${String(value)}`,
    );
  }
}

/**
 * Rounds half away from zero — the convention Indian financial reporting
 * expects, and the one `toFixed` does NOT reliably give (it rounds half to even
 * on some inputs due to binary representation).
 *
 * ADR-010 requires the rounding rule to be documented but does not specify it.
 * This is that decision; it needs ratification before go-live.
 */
export function roundHalfUp(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Rupees -> paise. Accepts the decimal amounts a human types.
 *
 * Multiplies in a way that survives binary floating point: `19.99 * 100` is
 * 1998.9999999999998, which would truncate to 1998 paise — a silent 1-paise
 * loss on every such amount.
 */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new MoneyError(`Cannot convert non-finite value to paise: ${String(rupees)}`);
  }
  const paise = roundHalfUp(Number((rupees * PAISE_PER_RUPEE).toFixed(4)));
  assertPaise(paise, 'converted amount');
  return paise;
}

/**
 * Paise -> rupees as a Number. For DISPLAY ONLY — never store, compare or sum
 * the result. Use `formatPaise` for anything user-facing.
 */
export function toRupees(paise: number): number {
  assertPaise(paise);
  return paise / PAISE_PER_RUPEE;
}

/** Sums paise amounts, validating each. Returns 0 for an empty list. */
export function sumPaise(amounts: readonly number[]): number {
  let total = 0;
  for (const [index, amount] of amounts.entries()) {
    assertPaise(amount, `amounts[${index}]`);
    total += amount;
  }
  assertPaise(total, 'total');
  return total;
}

/** Splits paise into whole rupees and the remaining paise. */
export function splitPaise(paise: number): { rupees: number; paise: number } {
  assertPaise(paise);
  return {
    rupees: Math.floor(paise / PAISE_PER_RUPEE),
    paise: paise % PAISE_PER_RUPEE,
  };
}
