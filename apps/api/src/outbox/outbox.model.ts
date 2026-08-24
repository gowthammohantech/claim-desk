import { OutboxStatus } from '@claimdesk/contracts';
import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `outbox` — domain events written in the SAME transaction as the business
 * mutation (ADR-009), then drained into `jobs` by the worker.
 *
 * This is what gives ClaimDesk reliable async delivery without Redis or BullMQ
 * (ADR-004): if the mutation commits, the event is committed with it; if it
 * rolls back, so does the event. There is no window where a claim is submitted
 * but its notification was lost.
 */
export interface OutboxDoc {
  _id: Types.ObjectId;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  correlationId: string;
  status: string;
  attempts: number;
  availableAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  occurredAt: Date;
  processedAt?: Date | null;
  lastError?: string | null;
}

const outboxSchema = new Schema<OutboxDoc>(
  {
    eventType: { type: String, required: true },
    aggregateType: { type: String, required: true },
    aggregateId: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    correlationId: { type: String, required: true },
    status: { type: String, required: true, default: OutboxStatus.PENDING },
    attempts: { type: Number, required: true, default: 0 },
    availableAt: { type: Date, required: true },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    occurredAt: { type: Date, required: true },
    processedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'outbox',
    minimize: false,
  },
);

export const OutboxModel =
  (mongoose.models['Outbox'] as mongoose.Model<OutboxDoc> | undefined) ??
  mongoose.model<OutboxDoc>('Outbox', outboxSchema);
