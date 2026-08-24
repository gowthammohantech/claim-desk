import { OutboxStatus } from '@claimdesk/contracts';

import { type OutboxRecord, type Tx, sessionOf } from '../platform/database/index.js';
import { OutboxModel } from './outbox.model.js';

/**
 * Persists outbox rows INSIDE the caller's transaction.
 *
 * Injected into the unit of work by `main.ts`, alongside the audit writer, so
 * the mutation, its audit trail and its outbox rows all commit together.
 *
 * Rows land `PENDING` and immediately available; the dispatcher picks them up
 * on its next tick.
 */
export async function writeOutboxEvents(events: readonly OutboxRecord[], tx: Tx): Promise<void> {
  if (events.length === 0) return;

  await OutboxModel.insertMany(
    events.map((event) => ({
      eventType: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload,
      correlationId: event.correlationId,
      status: OutboxStatus.PENDING,
      attempts: 0,
      availableAt: event.occurredAt,
      occurredAt: event.occurredAt,
    })),
    { session: sessionOf(tx), ordered: true },
  );
}
