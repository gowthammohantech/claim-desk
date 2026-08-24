import { ClaimStatus, PolicyOutcome } from '@claimdesk/contracts';

/**
 * Semantic colour roles used by chips, callouts and badges.
 *
 * Mapping follows the prototype: green = within policy / verified / paid,
 * amber = policy exception, red = duplicate / reject / return,
 * violet = smart check, blue = in-flight, neutral = draft / terminal-inactive.
 */
export const TONES = ['neutral', 'accent', 'ok', 'warn', 'danger', 'violet'] as const;
export type Tone = (typeof TONES)[number];

const CLAIM_STATUS_TONE: Record<ClaimStatus, Tone> = {
  [ClaimStatus.DRAFT]: 'neutral',
  [ClaimStatus.SUBMITTED]: 'accent',
  [ClaimStatus.IN_APPROVAL]: 'accent',
  [ClaimStatus.RETURNED]: 'warn',
  [ClaimStatus.REJECTED]: 'danger',
  [ClaimStatus.APPROVED]: 'ok',
  [ClaimStatus.FINANCE_REVIEW]: 'accent',
  [ClaimStatus.VERIFIED]: 'ok',
  [ClaimStatus.PAYMENT_PROCESSING]: 'accent',
  [ClaimStatus.PAID]: 'ok',
  [ClaimStatus.CANCELLED]: 'neutral',
};

const POLICY_OUTCOME_TONE: Record<PolicyOutcome, Tone> = {
  [PolicyOutcome.PASS]: 'ok',
  [PolicyOutcome.WARNING]: 'warn',
  [PolicyOutcome.EXCEPTION_REQUIRES_JUSTIFICATION]: 'warn',
  [PolicyOutcome.BLOCKED]: 'danger',
};

export const claimStatusTone = (status: ClaimStatus): Tone => CLAIM_STATUS_TONE[status];

export const policyOutcomeTone = (outcome: PolicyOutcome): Tone => POLICY_OUTCOME_TONE[outcome];

/** Human label for a claim status. Terminology must match across web and mobile (PRD §13). */
export const claimStatusLabel = (status: ClaimStatus): string =>
  status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
