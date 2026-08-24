/**
 * Transactional outbox events (requirements/TDD.md §15, ADR-009).
 *
 * Written in the SAME MongoDB transaction as the business mutation, then
 * drained by the worker. Notification delivery never participates in the
 * core business transaction.
 */
export const OutboxEventType = {
  CLAIM_SUBMITTED: 'ClaimSubmitted',
  APPROVAL_ASSIGNED: 'ApprovalAssigned',
  APPROVAL_COMPLETED: 'ApprovalCompleted',
  CLAIM_RETURNED: 'ClaimReturned',
  CLAIM_APPROVED: 'ClaimApproved',
  FINANCE_VERIFIED: 'FinanceVerified',
  PAYMENT_RECORDED: 'PaymentRecorded',
  EXPENSE_RECEIPT_UPLOADED: 'ExpenseReceiptUploaded',
} as const;

export type OutboxEventType = (typeof OutboxEventType)[keyof typeof OutboxEventType];

export const OUTBOX_EVENT_TYPES = Object.values(OutboxEventType) as readonly OutboxEventType[];
