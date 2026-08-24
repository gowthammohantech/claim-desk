/** Header name for the idempotency key. Required on all mutating commands. */
export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

/** Minimum length the API enforces on an idempotency key. */
export const IDEMPOTENCY_KEY_MIN_LENGTH = 8;

/** Header carrying the correlation id across API, worker and client. */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/** API version prefix. The OpenAPI server URL is `.../v1`. */
export const API_VERSION_PREFIX = '/v1';

/**
 * Operations that require an `Idempotency-Key` header
 * (design/06-api-contract.yaml).
 */
export const IDEMPOTENT_OPERATIONS = [
  'createExpense',
  'submitClaim',
  'resubmitClaim',
  'decideApproval',
  'verifyClaim',
  'createPaymentBatch',
  'markPaymentPaid',
] as const;

export type IdempotentOperation = (typeof IDEMPOTENT_OPERATIONS)[number];

/** A cursor-paginated collection response. */
export interface CursorPage<T> {
  items: T[];
  nextCursor?: string | undefined;
}
