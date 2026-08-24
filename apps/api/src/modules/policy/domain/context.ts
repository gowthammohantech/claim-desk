import type { PolicyContext } from './types.js';

/**
 * Field-path resolution, via a WHITELIST rather than a generic deep-get.
 *
 * Two reasons this is a fixed table and not `path.split('.').reduce(...)`:
 *
 *  1. A generic deep-get accepts `__proto__` and `constructor`, which turns a
 *     policy rule — data an admin can author — into a prototype-pollution
 *     vector.
 *  2. An unknown path can then be rejected at PUBLISH time, so a typo is a 422
 *     when the admin saves the rule rather than a silent never-matches (or a
 *     500) during expense capture months later.
 */
export type FieldResolver = (context: PolicyContext) => unknown;

export const FIELD_PATHS: Readonly<Record<string, FieldResolver>> = {
  'employee.id': (c) => c.employee.id,
  'employee.grade': (c) => c.employee.grade,
  'employee.branch': (c) => c.employee.branch,
  'employee.department': (c) => c.employee.department,

  'category.id': (c) => c.category.id,
  'category.code': (c) => c.category.code,
  'category.receiptRequired': (c) => c.category.receiptRequired,

  'amount.paise': (c) => c.amount.paise,

  'expense.date': (c) => c.expense.date,
  'expense.captureMode': (c) => c.expense.captureMode,

  'merchant.raw': (c) => c.merchant.raw,
  'merchant.normalized': (c) => c.merchant.normalized,

  classification: (c) => c.classification,

  'client.id': (c) => c.client.id,
  'engagement.id': (c) => c.engagement.id,
  'engagement.status': (c) => c.engagement.status,

  'receipt.count': (c) => c.receipt.count,
  'receipt.present': (c) => c.receipt.present,

  'mileage.distanceKm': (c) => c.mileage.distanceKm,
  'mileage.ratePaisePerKm': (c) => c.mileage.ratePaisePerKm,

  'trip.domestic': (c) => c.trip.domestic,
  'trip.nights': (c) => c.trip.nights,

  'duplicate.maxScore': (c) => c.duplicate.maxScore,
  'duplicate.unresolvedCount': (c) => c.duplicate.unresolvedCount,

  'justification.provided': (c) => c.justification.provided,
};

export const KNOWN_FIELD_PATHS: readonly string[] = Object.keys(FIELD_PATHS);

export function isKnownFieldPath(path: string): boolean {
  return Object.hasOwn(FIELD_PATHS, path);
}

/**
 * Returns `undefined` for an unknown path; the operator then simply does not match.
 *
 * The `hasOwn` guard is load-bearing, not defensive style: a plain
 * `FIELD_PATHS[path]` lookup for `__proto__` returns `Object.prototype` — truthy,
 * and not a function — so calling it throws and takes the whole evaluation down.
 * That would have handed an admin-authored rule a way to 500 every expense
 * creation, which is precisely what this whitelist exists to prevent.
 */
export function resolveField(context: PolicyContext, path: string): unknown {
  if (!Object.hasOwn(FIELD_PATHS, path)) return undefined;
  const resolver = FIELD_PATHS[path];
  return typeof resolver === 'function' ? resolver(context) : undefined;
}
