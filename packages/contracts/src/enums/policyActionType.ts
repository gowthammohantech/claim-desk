/** Actions a matched policy rule may emit (design/09-policy-engine-spec.md §4). */
export const PolicyActionType = {
  ALLOW: 'ALLOW',
  BLOCK: 'BLOCK',
  WARN: 'WARN',
  REQUIRE_RECEIPT: 'REQUIRE_RECEIPT',
  LIMIT: 'LIMIT',
  REQUIRE_JUSTIFICATION: 'REQUIRE_JUSTIFICATION',
  MARK_EXCEPTION: 'MARK_EXCEPTION',
  ADD_APPROVAL_STAGE: 'ADD_APPROVAL_STAGE',
  SET_MILEAGE_RATE: 'SET_MILEAGE_RATE',
} as const;

export type PolicyActionType = (typeof PolicyActionType)[keyof typeof PolicyActionType];

export const POLICY_ACTION_TYPES = Object.values(PolicyActionType) as readonly PolicyActionType[];
