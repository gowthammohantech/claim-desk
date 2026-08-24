/** Policy evaluation outcome (design/09-policy-engine-spec.md). Mirrors Expense.policyOutcome and PolicyEvaluation.overallOutcome. */
export const PolicyOutcome = {
  PASS: 'PASS',
  WARNING: 'WARNING',
  EXCEPTION_REQUIRES_JUSTIFICATION: 'EXCEPTION_REQUIRES_JUSTIFICATION',
  BLOCKED: 'BLOCKED',
} as const;

export type PolicyOutcome = (typeof PolicyOutcome)[keyof typeof PolicyOutcome];

export const POLICY_OUTCOMES = Object.values(PolicyOutcome) as readonly PolicyOutcome[];
