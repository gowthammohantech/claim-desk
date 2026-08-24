import mongoose, { type ClientSession } from 'mongoose';

import { newId } from '../util/ids.js';
import { getContext } from '../util/requestContext.js';
import type { Clock } from '../util/clock.js';
import {
  type AuditEventInput,
  type OutboxEventInput,
  type Tx,
  type TxOptions,
  type TxScope,
  type UnitOfWork,
} from './tx.js';

/**
 * Narrows the opaque `Tx` back to a real session. The ONLY place this cast
 * happens — infrastructure calls it, application never sees it.
 */
export function sessionOf(tx: Tx): ClientSession {
  return tx as unknown as ClientSession;
}

/** A fully-stamped audit event, ready to insert. */
export interface AuditRecord extends AuditEventInput {
  eventId: string;
  occurredAt: Date;
  correlationId: string;
  requestId?: string | undefined;
  source: string;
  actor: { employeeId: string; role?: string | undefined };
}

/** A fully-stamped outbox row, ready to insert. */
export interface OutboxRecord extends OutboxEventInput {
  correlationId: string;
  occurredAt: Date;
}

/**
 * Writers are injected rather than imported: `platform/` is lint-banned from
 * importing any module, and the audit writer lives in `modules/audit`.
 * `main.ts` wires the real ones at composition time.
 */
export interface UnitOfWorkWriters {
  writeAuditEvents(events: readonly AuditRecord[], tx: Tx): Promise<void>;
  writeOutboxEvents(events: readonly OutboxRecord[], tx: Tx): Promise<void>;
}

export interface MongoUnitOfWorkDeps {
  writers: UnitOfWorkWriters;
  clock: Clock;
}

export class MissingAuditError extends Error {
  constructor() {
    super(
      'A mutating transaction committed without recording an audit event. ' +
        'design/10-audit-event-catalog.md covers every business mutation; if this ' +
        'write genuinely needs none, pass requireAudit: false and say why.',
    );
    this.name = 'MissingAuditError';
  }
}

export function createMongoUnitOfWork({ writers, clock }: MongoUnitOfWorkDeps): UnitOfWork {
  return {
    async run<T>(options: TxOptions, fn: (scope: TxScope) => Promise<T>): Promise<T> {
      const { actor, source, requireAudit = true } = options;
      const session = await mongoose.startSession();

      try {
        let result: T | undefined;
        let auditCount = 0;

        await session.withTransaction(async () => {
          /*
           * RESET PER ATTEMPT, not per run.
           *
           * `withTransaction` re-runs this callback on a TransientTransactionError
           * — which includes the WriteConflict that two concurrent approval
           * decisions produce. Buffers declared outside would accumulate across
           * attempts and the retry would write every audit event twice.
           *
           * This is the single sharpest edge in the persistence design.
           */
          const audits: AuditRecord[] = [];
          const events: OutboxRecord[] = [];

          const context = getContext();
          const correlationId = context?.correlationId ?? newId();
          const occurredAt = clock.now();

          const tx = session as unknown as Tx;

          const scope: TxScope = {
            tx,
            audit(event: AuditEventInput) {
              audits.push({
                ...event,
                eventId: newId(),
                occurredAt: clock.now(),
                correlationId,
                ...(context?.requestId ? { requestId: context.requestId } : {}),
                source,
                actor: { employeeId: actor.employeeId, role: actor.role },
              });
            },
            emit(event: OutboxEventInput) {
              events.push({ ...event, correlationId, occurredAt });
            },
          };

          result = await fn(scope);

          // Flush INSIDE the transaction — ADR-009 and design/10 §3 require the
          // mutation, its audit trail and its outbox rows to commit together or
          // not at all. That is what makes the outbox reliable without a queue.
          if (audits.length > 0) await writers.writeAuditEvents(audits, tx);
          if (events.length > 0) await writers.writeOutboxEvents(events, tx);

          auditCount = audits.length;
        });

        if (requireAudit && auditCount === 0) throw new MissingAuditError();

        return result as T;
      } finally {
        await session.endSession();
      }
    },
  };
}
