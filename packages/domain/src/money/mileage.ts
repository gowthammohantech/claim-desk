import { MoneyError, assertPaise, roundHalfUp } from './paise.js';

/**
 * Mileage expense calculation (design/04-data-model.md — the `expenses.mileage`
 * sub-document).
 *
 *   amountPaise = round(distanceKm * ratePaisePerKm)
 *
 * `distanceKm` is the only non-integer input in the money path. The result is
 * rounded half away from zero to land back on an integer paise amount.
 */

export interface MileageInput {
  distanceKm: number;
  ratePaisePerKm: number;
}

export const MAX_DISTANCE_KM = 100_000;

/** Computes the reimbursable amount in paise for a mileage claim. */
export function computeMileagePaise({ distanceKm, ratePaisePerKm }: MileageInput): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0 || distanceKm > MAX_DISTANCE_KM) {
    throw new MoneyError(
      `distanceKm must be between 0 and ${MAX_DISTANCE_KM}, received: ${String(distanceKm)}`,
    );
  }
  assertPaise(ratePaisePerKm, 'ratePaisePerKm');

  const amount = roundHalfUp(Number((distanceKm * ratePaisePerKm).toFixed(4)));
  assertPaise(amount, 'mileage amount');
  return amount;
}
