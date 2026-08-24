import { JobStatus } from '@claimdesk/contracts';
import type { ClientSession } from 'mongoose';

import { type Tx, isDuplicateKey, sessionOf } from '../platform/database/index.js';
import { nextAvailableAt } from './backoff.js';
import { type JobDoc, JobModel } from './job.model.js';

/** How long a completed job is retained before the TTL index removes it. */
const COMPLETED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface EnqueueInput {
  type: string;
  payload: Record<string, unknown>;
  correlationId: string;
  idempotencyKey?: string | undefined;
  availableAt?: Date | undefined;
  maxAttempts?: number | undefined;
}

export interface JobQueue {
  enqueue(input: EnqueueInput, tx?: Tx): Promise<{ enqueued: boolean; jobId?: string }>;
  claimNext(workerId: string, now: Date): Promise<JobDoc | null>;
  heartbeat(jobId: string, workerId: string, now: Date): Promise<void>;
  complete(jobId: string, now: Date): Promise<void>;
  fail(job: JobDoc, error: string, now: Date): Promise<'retry' | 'dead'>;
  reclaimExpired(leaseMs: number, now: Date): Promise<number>;
}

export function createJobQueue(defaultMaxAttempts: number): JobQueue {
  return {
    /**
     * Inserts a job. When `idempotencyKey` is set, a duplicate insert is
     * SUCCESS, not an error: it means the work is already queued, which is
     * exactly what the outbox dispatcher needs when it retries after a crash
     * between inserting the job and marking the outbox row dispatched.
     */
    async enqueue(input, tx) {
      const now = new Date();
      const session: ClientSession | undefined = tx ? sessionOf(tx) : undefined;

      try {
        const [created] = await JobModel.create(
          [
            {
              type: input.type,
              payload: input.payload,
              status: JobStatus.PENDING,
              attempts: 0,
              maxAttempts: input.maxAttempts ?? defaultMaxAttempts,
              availableAt: input.availableAt ?? now,
              correlationId: input.correlationId,
              idempotencyKey: input.idempotencyKey ?? null,
              createdAt: now,
            },
          ],
          session ? { session } : {},
        );

        return { enqueued: true, ...(created ? { jobId: created._id.toHexString() } : {}) };
      } catch (error) {
        if (isDuplicateKey(error)) return { enqueued: false };
        throw error;
      }
    },

    /**
     * Leases the next due job. One atomic operation — no transaction needed,
     * and none wanted: a transaction here would serialize the whole worker.
     *
     * `sort` by availableAt makes the queue roughly FIFO; `_id` breaks ties
     * deterministically so two workers scanning simultaneously do not thrash on
     * the same document.
     */
    async claimNext(workerId, now) {
      return JobModel.findOneAndUpdate(
        { status: JobStatus.PENDING, availableAt: { $lte: now } },
        {
          $set: {
            status: JobStatus.RUNNING,
            lockedAt: now,
            lockedBy: workerId,
            lastHeartbeatAt: now,
          },
          $inc: { attempts: 1 },
        },
        { sort: { availableAt: 1, _id: 1 }, new: true },
      )
        .lean<JobDoc>()
        .exec();
    },

    /** Keeps a long-running job's lease alive so the reaper does not steal it. */
    async heartbeat(jobId, workerId, now) {
      await JobModel.updateOne(
        { _id: jobId, lockedBy: workerId, status: JobStatus.RUNNING },
        { $set: { lastHeartbeatAt: now } },
      ).exec();
    },

    async complete(jobId, now) {
      await JobModel.updateOne(
        { _id: jobId },
        {
          $set: {
            status: JobStatus.COMPLETED,
            completedAt: now,
            lockedAt: null,
            lockedBy: null,
            expiresAt: new Date(now.getTime() + COMPLETED_RETENTION_MS),
          },
        },
      ).exec();
    },

    /**
     * Records a failure and decides retry vs dead-letter.
     *
     * A dead job is NEVER deleted — design/11 §8: "Poison jobs stop after
     * configurable max attempts and require Admin retry. Never silently drop
     * integration events."
     */
    async fail(job, error, now) {
      const exhausted = job.attempts >= job.maxAttempts;

      if (exhausted) {
        await JobModel.updateOne(
          { _id: job._id },
          {
            $set: {
              status: JobStatus.DEAD_LETTER,
              deadAt: now,
              lastError: error,
              lockedAt: null,
              lockedBy: null,
            },
          },
        ).exec();
        return 'dead';
      }

      await JobModel.updateOne(
        { _id: job._id },
        {
          $set: {
            status: JobStatus.PENDING,
            availableAt: nextAvailableAt(job.attempts, now),
            lastError: error,
            lockedAt: null,
            lockedBy: null,
            lastHeartbeatAt: null,
          },
        },
      ).exec();
      return 'retry';
    },

    /**
     * Returns jobs whose worker died mid-run. Without this a crashed pod's jobs
     * stay RUNNING forever and the queue silently drains to a halt.
     */
    async reclaimExpired(leaseMs, now) {
      const cutoff = new Date(now.getTime() - leaseMs);
      const result = await JobModel.updateMany(
        { status: JobStatus.RUNNING, lastHeartbeatAt: { $lt: cutoff } },
        {
          $set: { status: JobStatus.PENDING, availableAt: now },
          $unset: { lockedAt: '', lockedBy: '', lastHeartbeatAt: '' },
        },
      ).exec();
      return result.modifiedCount;
    },
  };
}
