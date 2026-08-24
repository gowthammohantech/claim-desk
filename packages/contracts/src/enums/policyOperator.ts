/** Condition operators in the policy rule DSL (design/09-policy-engine-spec.md §3). */
export const PolicyOperator = {
  EQ: 'EQ',
  NE: 'NE',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  GT: 'GT',
  GTE: 'GTE',
  LT: 'LT',
  LTE: 'LTE',
  EXISTS: 'EXISTS',
  BETWEEN: 'BETWEEN',
} as const;

export type PolicyOperator = (typeof PolicyOperator)[keyof typeof PolicyOperator];

export const POLICY_OPERATORS = Object.values(PolicyOperator) as readonly PolicyOperator[];
