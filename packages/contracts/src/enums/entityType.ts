/** Aggregate types an audit event may reference (design/10-audit-event-catalog.md §2). */
export const EntityType = {
  EMPLOYEE: 'employee',
  IDENTITY: 'identity',
  EXPENSE: 'expense',
  RECEIPT: 'receipt',
  APPROVAL_TASK: 'approvalTask',
  CLAIM: 'claim',
  PAYMENT_BATCH: 'paymentBatch',
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
  POLICY: 'policy',
  WORKFLOW: 'workflow',
  ENGAGEMENT: 'engagement',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const ENTITY_TYPES = Object.values(EntityType) as readonly EntityType[];
