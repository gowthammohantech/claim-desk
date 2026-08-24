import type { AuditEventName, EntityType, OutboxEventType, RoleCode } from '@claimdesk/contracts';

/**
 * The transaction boundary, expressed so the application layer never names
 * Mongoose.
 *
 * `Tx` is deliberately OPAQUE. The application layer is lint-banned from
 * importing mongoose — not even as a type — so a repository port cannot mention
 * `ClientSession`. Platform is importable from application, so the handle is
 * declared here and narrowed back to a real session by `sessionOf()` inside
 * `infrastructure/`.
 *
 * That is also the architecturally correct answer: a use case should not know
 * its transaction happens to be a Mongo session.
 */
declare const txBrand: unique symbol;

export interface Tx {
  readonly [txBrand]: true;
}

/** Who is acting, stamped once per transaction onto every audit event. */
export interface TxActor {
  employeeId: string;
  role?: RoleCode | undefined;
}

/** Where the mutation originated. Required by the audit envelope (design/10 §1). */
export type AuditSource = 'api' | 'worker' | 'migration' | 'seed';

export interface AuditEventInput {
  eventName: AuditEventName;
  entityType: EntityType;
  entityId: string;
  payload?: Record<string, unknown> | undefined;
  before?: Record<string, unknown> | undefined;
  after?: Record<string, unknown> | undefined;
}

export interface OutboxEventInput<TPayload = Record<string, unknown>> {
  type: OutboxEventType;
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
}

/**
 * Handed to the callback of `UnitOfWork.run`.
 *
 * `audit()` and `emit()` BUFFER rather than write immediately; the unit of work
 * flushes both inside the same transaction as the business mutation. That is
 * what ADR-009 and design/10 §3 require, and it means a use case cannot
 * accidentally write an audit event that survives a rollback.
 */
export interface TxScope {
  readonly tx: Tx;
  audit(event: AuditEventInput): void;
  emit(event: OutboxEventInput): void;
}

export interface TxOptions {
  actor: TxActor;
  source: AuditSource;
  /**
   * Every business mutation in design/10's catalogue has an audit event, so a
   * mutating transaction that records none is a bug. Set false only for the
   * rare genuinely-unaudited write (a lease renewal, a counter bump).
   */
  requireAudit?: boolean | undefined;
}

export interface UnitOfWork {
  run<T>(options: TxOptions, fn: (scope: TxScope) => Promise<T>): Promise<T>;
}

/**
 * Outcome of a guarded conditional update.
 *
 * Repositories return this instead of throwing, because they do not know about
 * HTTP; the use case maps `reason` to an `AppError`. Without the distinction,
 * every conflicting write looks identical and the API answers 409 for a missing
 * record, a forbidden one and a genuinely stale one alike.
 */
export type GuardFailure = 'not-found' | 'forbidden' | 'illegal-state' | 'stale-version';

export type GuardResult<T> = { ok: true; value: T } | { ok: false; reason: GuardFailure };

export const guardOk = <T>(value: T): GuardResult<T> => ({ ok: true, value });

export const guardFailed = <T>(reason: GuardFailure): GuardResult<T> => ({ ok: false, reason });

/**
 * Maps the value inside a successful guard result.
 *
 * `guardedUpdate` works in documents; ports speak in domain entities. Mapping
 * here rather than at each call site keeps the failure branch from being
 * accidentally re-typed or swallowed.
 */
export const mapGuardResult = <A, B>(
  result: GuardResult<A>,
  map: (value: A) => B,
): GuardResult<B> => (result.ok ? { ok: true, value: map(result.value) } : result);
