import type { PolicyDefinition } from './types.js';

/**
 * Rule ordering — design/09 §6 levels 3 to 6.
 *
 * Levels 1 (explicit BLOCK) and 2 (mandatory controls) are OUTCOME rules, not
 * ordering rules: they are applied when folding actions, because a
 * lower-precedence ALLOW must never clear a higher-precedence BLOCK. Only
 * levels 3–6 are a sort, and they live here.
 */

/**
 * Level 3, "more-specific rule over less-specific rule".
 *
 * The spec does not define specificity, so this is an implementation decision,
 * documented as such: weight each matched condition field by how narrowly it
 * selects, following the scoping hierarchy in requirements/TDD.md §8.7
 * (engagement > category > grade > branch > organisation default).
 *
 * Isolated here so it can be re-tuned without touching the evaluator.
 */
const FIELD_WEIGHTS: Readonly<Record<string, number>> = {
  'engagement.id': 16,
  'client.id': 12,
  'category.code': 8,
  'category.id': 8,
  'employee.grade': 4,
  'employee.id': 16,
  'employee.branch': 2,
  'employee.department': 2,
  classification: 2,
};

const DEFAULT_FIELD_WEIGHT = 1;

export function specificityOf(policy: PolicyDefinition): number {
  return policy.conditions.all.reduce(
    (total, leaf) => total + (FIELD_WEIGHTS[leaf.field] ?? DEFAULT_FIELD_WEIGHT),
    0,
  );
}

/**
 * A TOTAL order. The final `policyCode` tiebreak is not decoration: without a
 * deterministic last resort the ordering falls through to whatever order Mongo
 * returned, and the same expense produces a different policy snapshot on
 * different days.
 */
export function comparePolicies(a: PolicyDefinition, b: PolicyDefinition): number {
  // Level 6 — the default category policy always sorts last.
  const aDefault = a.defaultCategoryPolicy === true;
  const bDefault = b.defaultCategoryPolicy === true;
  if (aDefault !== bDefault) return aDefault ? 1 : -1;

  // Level 3 — more specific first.
  const specificity = specificityOf(b) - specificityOf(a);
  if (specificity !== 0) return specificity;

  // Level 4 — higher priority number wins.
  if (a.priority !== b.priority) return b.priority - a.priority;

  // Level 5 — newer effective version wins.
  const effective = b.effectiveFrom.getTime() - a.effectiveFrom.getTime();
  if (effective !== 0) return effective;
  if (a.version !== b.version) return b.version - a.version;

  return a.policyCode < b.policyCode ? -1 : a.policyCode > b.policyCode ? 1 : 0;
}

/** Sorts a matched set into evaluation order. Does not mutate the input. */
export function orderByPrecedence(policies: readonly PolicyDefinition[]): PolicyDefinition[] {
  return [...policies].sort(comparePolicies);
}

/** True when the policy is in force at `at` (design/09 §8, effective-dating). */
export function isEffective(policy: PolicyDefinition, at: Date): boolean {
  if (policy.effectiveFrom.getTime() > at.getTime()) return false;
  if (policy.effectiveTo && policy.effectiveTo.getTime() <= at.getTime()) return false;
  return true;
}
