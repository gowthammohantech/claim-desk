/** Payment batch lifecycle. */
export const PaymentBatchStatus = {
  OPEN: 'OPEN',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type PaymentBatchStatus = (typeof PaymentBatchStatus)[keyof typeof PaymentBatchStatus];

export const PAYMENT_BATCH_STATUSES = Object.values(PaymentBatchStatus) as readonly PaymentBatchStatus[];
