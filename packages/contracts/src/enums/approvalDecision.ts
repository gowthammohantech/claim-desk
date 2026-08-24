/** Approver decisions. Reason is mandatory for RETURN and REJECT. */
export const ApprovalDecision = {
  APPROVE: 'APPROVE',
  RETURN: 'RETURN',
  REJECT: 'REJECT',
} as const;

export type ApprovalDecision = (typeof ApprovalDecision)[keyof typeof ApprovalDecision];

export const APPROVAL_DECISIONS = Object.values(ApprovalDecision) as readonly ApprovalDecision[];
