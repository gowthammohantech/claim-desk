/**
 * The audit event catalog (design/10-audit-event-catalog.md §2).
 *
 * Naming convention: `domain.past_tense_action`, dot-separated with a
 * snake_case verb. Audit data is append-only; events are emitted in the
 * backend service/domain layer at the mutation and — where the mutation also
 * writes the outbox — in the SAME MongoDB transaction.
 *
 * 35 events. Generated from the catalog; keep in sync with the doc.
 *
 * Known doc gap: `ClaimApproved` exists as an outbox event but has no
 * corresponding `claim.approved` audit event in the catalog.
 */
export const AuditEventName = {
  ACCESS_ROLE_CHANGED: 'access.role_changed',
  APPROVAL_APPROVED: 'approval.approved',
  APPROVAL_ASSIGNED: 'approval.assigned',
  APPROVAL_REJECTED: 'approval.rejected',
  APPROVAL_RETURNED: 'approval.returned',
  AUTH_LOGIN_FAILED: 'auth.login_failed',
  AUTH_LOGIN_SUCCEEDED: 'auth.login_succeeded',
  CLAIM_CREATED: 'claim.created',
  CLAIM_REJECTED: 'claim.rejected',
  CLAIM_RESUBMITTED: 'claim.resubmitted',
  CLAIM_RETURNED: 'claim.returned',
  CLAIM_SUBMITTED: 'claim.submitted',
  DUPLICATE_DETECTED: 'duplicate.detected',
  DUPLICATE_DISCARDED: 'duplicate.discarded',
  DUPLICATE_KEPT: 'duplicate.kept',
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_DELETED_DRAFT: 'expense.deleted_draft',
  EXPENSE_UPDATED: 'expense.updated',
  FINANCE_RETURNED: 'finance.returned',
  FINANCE_REVIEW_STARTED: 'finance.review_started',
  FINANCE_VERIFIED: 'finance.verified',
  MASTER_ENGAGEMENT_CHANGED: 'master.engagement_changed',
  NOTIFICATION_CREATED: 'notification.created',
  OCR_COMPLETED: 'ocr.completed',
  OCR_FAILED: 'ocr.failed',
  OCR_STARTED: 'ocr.started',
  PAYMENT_BATCH_CREATED: 'payment.batch_created',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_PAID: 'payment.paid',
  PAYMENT_PROCESSING_STARTED: 'payment.processing_started',
  POLICY_EVALUATED: 'policy.evaluated',
  POLICY_EXCEPTION_JUSTIFIED: 'policy.exception_justified',
  POLICY_VERSION_PUBLISHED: 'policy.version_published',
  RECEIPT_UPLOADED: 'receipt.uploaded',
  WORKFLOW_VERSION_PUBLISHED: 'workflow.version_published',
} as const;

export type AuditEventName = (typeof AuditEventName)[keyof typeof AuditEventName];

export const AUDIT_EVENT_NAMES = Object.values(AuditEventName) as readonly AuditEventName[];
