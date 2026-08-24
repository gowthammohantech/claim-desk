import mongoose, { type ClientSession } from 'mongoose';

/**
 * Runs `fn` inside a MongoDB transaction.
 *
 * Every business mutation that also writes the outbox or an audit event MUST go
 * through here — design/10-audit-event-catalog.md §3 and ADR-009 require the
 * mutation, its audit event and its outbox row to commit together or not at
 * all. That is what makes the outbox reliable without Redis.
 *
 * Requires a replica set. `withTransaction` already retries on
 * TransientTransactionError and UnknownTransactionCommitResult.
 */
export async function withTransaction<T>(fn: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
