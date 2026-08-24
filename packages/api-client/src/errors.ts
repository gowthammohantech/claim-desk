import type { ErrorEnvelope } from '@claimdesk/contracts';

/**
 * A non-2xx response from the API, carrying the standard error envelope
 * (requirements/TDD.md §11.2): `{ code, message, correlationId, details[] }`.
 *
 * Both clients render `message` and log `correlationId` — that id is the only
 * thing that ties a user-visible failure back to the server logs.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | undefined;
  readonly details: unknown;

  constructor(status: number, envelope: Partial<ErrorEnvelope> | undefined, fallback?: string) {
    super(envelope?.message ?? fallback ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = envelope?.code ?? `HTTP_${status}`;
    this.correlationId = envelope?.correlationId;
    this.details = envelope?.details;
  }

  /**
   * 409 — the claim or approval task moved on before this request landed.
   * The caller must refetch and re-present, never blind-retry: for approval
   * decisions the first valid terminal decision wins
   * (design/08-workflow-spec.md, concurrency).
   */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** 422 — the payload failed schema or business validation. */
  get isValidation(): boolean {
    return this.status === 422;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Safe to retry: transient server or network faults only. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

/** Narrowing helper for `catch` blocks. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
