/** When a policy action fires. Reconciles design/09 §5's action list with the §2 example's REQUIRE_JUSTIFICATION_ON_EXCEED spelling: that becomes {type: REQUIRE_JUSTIFICATION, on: EXCEED}. EXCEED fires only when a LIMIT on the same rule was breached. */
export const PolicyActionTrigger = {
  ALWAYS: 'ALWAYS',
  EXCEED: 'EXCEED',
} as const;

export type PolicyActionTrigger = (typeof PolicyActionTrigger)[keyof typeof PolicyActionTrigger];

export const POLICY_ACTION_TRIGGERS = Object.values(PolicyActionTrigger) as readonly PolicyActionTrigger[];
