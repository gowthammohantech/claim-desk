import type { AuditRecord, Tx } from '../../../platform/database/index.js';
import { sessionOf } from '../../../platform/database/index.js';
import { sha256 } from '../../../platform/security/index.js';
import { redactRecord } from '../domain/redact.js';
import { AuditEventModel } from './auditEvent.model.js';

/**
 * Persists a batch of audit events INSIDE the caller's transaction.
 *
 * `main.ts` injects this into the unit of work, which buffers events during the
 * transaction and flushes them here before commit. That is what ADR-009 and
 * design/10 §3 require: the mutation and its audit trail commit together or not
 * at all.
 */
export async function writeAuditEvents(events: readonly AuditRecord[], tx: Tx): Promise<void> {
  if (events.length === 0) return;

  const options = { hash: sha256 };

  await AuditEventModel.insertMany(
    events.map((event) => ({
      eventId: event.eventId,
      eventName: event.eventName,
      entityType: event.entityType,
      entityId: event.entityId,
      actor: event.actor,
      occurredAt: event.occurredAt,
      correlationId: event.correlationId,
      ...(event.requestId ? { requestId: event.requestId } : {}),
      source: event.source,
      ...(event.payload ? { payload: redactRecord(event.payload, options) } : {}),
      ...(event.before ? { before: redactRecord(event.before, options) } : {}),
      ...(event.after ? { after: redactRecord(event.after, options) } : {}),
    })),
    { session: sessionOf(tx), ordered: true },
  );
}
