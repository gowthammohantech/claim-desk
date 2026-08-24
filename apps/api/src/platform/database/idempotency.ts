import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `idempotencyKeys` — replay protection for the 9 mutating commands that
 * require an `Idempotency-Key` header.
 *
 * Keyed by `{employeeId, operationId, key}`:
 *
 *  - `employeeId` is not optional. Without it, guessing another user's key
 *    replays THEIR stored response body to you — a BOLA hole in the very
 *    mechanism meant to make retries safe.
 *  - `operationId` stops a client reusing one key across two endpoints and
 *    receiving the wrong replay.
 */
export interface IdempotencyKeyDoc {
  _id: Types.ObjectId;
  key: string;
  operationId: string;
  employeeId: string;
  requestHash: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  responseStatus?: number | null;
  /** The exact bytes the first caller received, replayed verbatim. */
  responseBody?: unknown;
  lockedAt: Date;
  completedAt?: Date | null;
  expiresAt: Date;
}

const idempotencyKeySchema = new Schema<IdempotencyKeyDoc>(
  {
    key: { type: String, required: true },
    operationId: { type: String, required: true },
    employeeId: { type: String, required: true },
    requestHash: { type: String, required: true },
    status: { type: String, required: true, default: 'IN_PROGRESS' },
    responseStatus: { type: Number, default: null },
    responseBody: { type: Schema.Types.Mixed, default: null },
    lockedAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'idempotencyKeys',
    minimize: false,
  },
);

export const IdempotencyKeyModel =
  (mongoose.models['IdempotencyKey'] as mongoose.Model<IdempotencyKeyDoc> | undefined) ??
  mongoose.model<IdempotencyKeyDoc>('IdempotencyKey', idempotencyKeySchema);

/** Long enough for a client that was offline overnight; short enough to bound the collection. */
export const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000;

/** How long a crashed in-flight request holds the key before it can be taken over. */
export const IDEMPOTENCY_LOCK_MS = 60_000;
