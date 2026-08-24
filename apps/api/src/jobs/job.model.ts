import { JobStatus } from '@claimdesk/contracts';
import mongoose, { Schema, type Types } from 'mongoose';

/**
 * `jobs` — executable work, leased by the worker.
 *
 * NOT in design/04-data-model.md, which defines only `outbox`. But the worker,
 * ADR-004 and requirements/TDD.md §14 all refer to "jobs", and conflating the
 * two would mean a row is simultaneously a record of what happened and a record
 * of what to do — with retry state mutating the event log. Kept separate:
 * `outbox` is history, `jobs` is work.
 *
 * `lockedAt` + `lastHeartbeatAt` implement the lease that design/12 §5 requires
 * to stop two workers running the same job.
 */
export interface JobDoc {
  _id: Types.ObjectId;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  maxAttempts: number;
  availableAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  lastHeartbeatAt?: Date | null;
  /** Unique where present — makes outbox -> job dispatch exactly-once. */
  idempotencyKey?: string | null;
  correlationId: string;
  lastError?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
  deadAt?: Date | null;
  /** Set only on completion; drives the TTL index. Failed jobs are kept. */
  expiresAt?: Date | null;
}

const jobSchema = new Schema<JobDoc>(
  {
    type: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: { type: String, required: true, default: JobStatus.PENDING },
    attempts: { type: Number, required: true, default: 0 },
    maxAttempts: { type: Number, required: true, default: 5 },
    availableAt: { type: Date, required: true },
    lockedAt: { type: Date, default: null },
    lockedBy: { type: String, default: null },
    lastHeartbeatAt: { type: Date, default: null },
    idempotencyKey: { type: String, default: null },
    correlationId: { type: String, required: true },
    lastError: { type: String, default: null },
    createdAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    deadAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  {
    versionKey: false,
    timestamps: false,
    autoIndex: false,
    autoCreate: false,
    collection: 'jobs',
    minimize: false,
  },
);

export const JobModel =
  (mongoose.models['Job'] as mongoose.Model<JobDoc> | undefined) ??
  mongoose.model<JobDoc>('Job', jobSchema);
