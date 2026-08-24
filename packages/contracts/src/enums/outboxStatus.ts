/** Outbox row lifecycle. Rows are written inside the business transaction and drained into jobs by the worker (ADR-009). */
export const OutboxStatus = {
  PENDING: 'PENDING',
  DISPATCHED: 'DISPATCHED',
  FAILED: 'FAILED',
} as const;

export type OutboxStatus = (typeof OutboxStatus)[keyof typeof OutboxStatus];

export const OUTBOX_STATUSES = Object.values(OutboxStatus) as readonly OutboxStatus[];
