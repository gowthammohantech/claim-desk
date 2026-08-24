/** Claim lifecycle states (design/08-workflow-spec.md §4). PAID and REJECTED are terminal in MVP. */
export const ClaimStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IN_APPROVAL: 'IN_APPROVAL',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
  APPROVED: 'APPROVED',
  FINANCE_REVIEW: 'FINANCE_REVIEW',
  VERIFIED: 'VERIFIED',
  PAYMENT_PROCESSING: 'PAYMENT_PROCESSING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const CLAIM_STATUSES = Object.values(ClaimStatus) as readonly ClaimStatus[];
