import { JobType, OutboxEventType, type OutboxEventType as OutboxEventTypeValue } from '@claimdesk/contracts';

/**
 * Maps a committed domain event onto the executable work it should produce.
 *
 * Pure data — no I/O, no module imports. That matters because `outbox/` is
 * lint-banned from importing any module; it may only see `@claimdesk/contracts`
 * and `platform/`.
 *
 * An event that produces no work maps to an empty array rather than being
 * absent, so the dispatcher never has to ask "is this unhandled or deliberately
 * silent?".
 */
export interface JobInput {
  type: string;
  payload: Record<string, unknown>;
  /** Makes outbox -> job dispatch exactly-once via the unique partial index. */
  idempotencyKey: string;
  availableAt?: Date;
}

type Dispatcher = (
  payload: Record<string, unknown>,
  outboxId: string,
) => JobInput[];

const notify =
  (notificationType: string): Dispatcher =>
  (payload, outboxId) => [
    {
      type: JobType.NOTIFICATION_SEND,
      payload: { notificationType, ...payload },
      idempotencyKey: `${outboxId}:${JobType.NOTIFICATION_SEND}`,
    },
  ];

/**
 * The 8 outbox events from requirements/TDD.md §15.
 *
 * Push is the only notification channel in scope (gaps.md GAP-008), so most
 * events produce exactly one `notification.send`. `FinanceVerified` also kicks
 * the accounting export, per design/11 §5.
 */
export const OUTBOX_DISPATCH: Record<OutboxEventTypeValue, Dispatcher> = {
  [OutboxEventType.CLAIM_SUBMITTED]: notify('CLAIM_SUBMITTED'),
  [OutboxEventType.APPROVAL_ASSIGNED]: notify('APPROVAL_ASSIGNED'),
  [OutboxEventType.APPROVAL_COMPLETED]: notify('APPROVAL_COMPLETED'),
  [OutboxEventType.CLAIM_RETURNED]: notify('CLAIM_RETURNED'),
  [OutboxEventType.CLAIM_APPROVED]: notify('CLAIM_APPROVED'),
  [OutboxEventType.FINANCE_VERIFIED]: (payload, outboxId) => [
    ...notify('FINANCE_VERIFIED')(payload, outboxId),
    {
      type: JobType.INTEGRATION_ACCOUNTING_EXPORT,
      payload,
      idempotencyKey: `${outboxId}:${JobType.INTEGRATION_ACCOUNTING_EXPORT}`,
    },
  ],
  [OutboxEventType.PAYMENT_RECORDED]: notify('PAYMENT_RECORDED'),
  [OutboxEventType.EXPENSE_RECEIPT_UPLOADED]: (payload, outboxId) => [
    {
      type: JobType.OCR_EXTRACT,
      payload,
      idempotencyKey: `${outboxId}:${JobType.OCR_EXTRACT}`,
    },
  ],
};

export function jobsForEvent(
  eventType: string,
  payload: Record<string, unknown>,
  outboxId: string,
): JobInput[] {
  const dispatcher = OUTBOX_DISPATCH[eventType as OutboxEventTypeValue];
  // An unmapped event type is a programming error, not a runtime condition:
  // every OutboxEventType has an entry above, and the type system enforces it.
  return dispatcher ? dispatcher(payload, outboxId) : [];
}
