import mongoose, { Schema } from 'mongoose';

/**
 * Human-readable sequence numbers: `CLM-2026-0128`, `EXP-2026-0417`,
 * `PB-2026-0009` — the format the prototype uses and Finance reads aloud.
 *
 * A `count() + 1` allocator collides the moment two people submit at once, and
 * the unique index turns that collision into a 500. This is the standard atomic
 * counter instead: one `findOneAndUpdate($inc, upsert)` per allocation.
 *
 * DELIBERATELY ALLOCATED OUTSIDE THE BUSINESS TRANSACTION. Two reasons:
 *
 *  1. `session.withTransaction` re-runs its callback on a transient error, so a
 *     counter bumped inside would advance once per attempt anyway.
 *  2. On rollback the number is burned. That is the right trade: a gap in the
 *     sequence is invisible to everyone, whereas a duplicate claimNo is a
 *     unique-index failure at commit time — far worse, and much harder to
 *     diagnose.
 *
 * Sequences reset per year, so the counter key carries the year.
 */
export interface CounterDoc {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<CounterDoc>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false, autoIndex: false, autoCreate: false, collection: 'counters' },
);

export const CounterModel =
  (mongoose.models['Counter'] as mongoose.Model<CounterDoc> | undefined) ??
  mongoose.model<CounterDoc>('Counter', counterSchema);

export type SequenceScope = 'claim' | 'expense' | 'paymentBatch';

const PREFIX: Record<SequenceScope, string> = {
  claim: 'CLM',
  expense: 'EXP',
  paymentBatch: 'PB',
};

/** Next value for a scope/year, atomically. */
export async function nextSequence(scope: SequenceScope, year: number): Promise<number> {
  const updated = await CounterModel.findOneAndUpdate(
    { _id: `${scope}:${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  )
    .lean<CounterDoc>()
    .exec();

  // upsert + returnDocument:'after' always yields a document.
  return updated?.seq ?? 1;
}

/**
 * Formats an allocated sequence, e.g. `CLM-2026-0128`.
 *
 * Padded to four digits for readability; a year that exceeds 9999 documents
 * simply grows the number rather than wrapping.
 */
export function formatSequence(scope: SequenceScope, year: number, seq: number): string {
  return `${PREFIX[scope]}-${year}-${String(seq).padStart(4, '0')}`;
}

/** Allocates and formats in one step. Call before opening the transaction. */
export async function allocateNumber(scope: SequenceScope, now: Date): Promise<string> {
  const year = now.getUTCFullYear();
  return formatSequence(scope, year, await nextSequence(scope, year));
}
