import { PolicyOperator } from '@claimdesk/contracts';

import { resolveField } from './context.js';
import type { PolicyContext, PolicyCondition, PolicyLeafCondition } from './types.js';

/**
 * The 10 operators from design/09 §3.
 *
 * None of them throw. A type mismatch — `GT` against a string, `BETWEEN`
 * against a non-pair — yields "no match", never an exception. A malformed rule
 * must not break expense creation for every employee at the firm; it should
 * simply fail to apply, and be caught by publish-time validation instead.
 */
function asComparable(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    // Dates arrive as ISO strings; comparing them lexically is correct for
    // ISO-8601 and avoids a timezone round-trip.
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function equals(actual: unknown, expected: unknown): boolean {
  if (actual instanceof Date && typeof expected === 'string') {
    return actual.toISOString() === expected || actual.getTime() === Date.parse(expected);
  }
  return actual === expected;
}

export function evaluateLeaf(condition: PolicyLeafCondition, context: PolicyContext): boolean {
  const actual = resolveField(context, condition.field);
  const { op, value } = condition;

  switch (op) {
    case PolicyOperator.EXISTS: {
      const present = actual !== undefined && actual !== null;
      // `{op: EXISTS, value: false}` asserts absence.
      return value === false ? !present : present;
    }

    case PolicyOperator.EQ:
      return equals(actual, value);

    case PolicyOperator.NE:
      return !equals(actual, value);

    case PolicyOperator.IN:
      return Array.isArray(value) && value.some((candidate) => equals(actual, candidate));

    case PolicyOperator.NOT_IN:
      return Array.isArray(value) && !value.some((candidate) => equals(actual, candidate));

    case PolicyOperator.GT:
    case PolicyOperator.GTE:
    case PolicyOperator.LT:
    case PolicyOperator.LTE: {
      const left = asComparable(actual);
      const right = asComparable(value);
      if (left === null || right === null) return false;
      if (op === PolicyOperator.GT) return left > right;
      if (op === PolicyOperator.GTE) return left >= right;
      if (op === PolicyOperator.LT) return left < right;
      return left <= right;
    }

    case PolicyOperator.BETWEEN: {
      if (!Array.isArray(value) || value.length !== 2) return false;
      const left = asComparable(actual);
      const low = asComparable(value[0]);
      const high = asComparable(value[1]);
      if (left === null || low === null || high === null) return false;
      // Inclusive at both ends: a limit "between 1000 and 2000" should include
      // exactly 2000, which is the reading a policy author expects.
      return left >= low && left <= high;
    }

    default:
      return false;
  }
}

/** All leaves must match — §2 defines no other combinator. */
export function matchesCondition(condition: PolicyCondition, context: PolicyContext): boolean {
  if (!Array.isArray(condition.all)) return false;
  // An empty `all` matches everything — that is how a default category policy
  // is written.
  return condition.all.every((leaf) => evaluateLeaf(leaf, context));
}
