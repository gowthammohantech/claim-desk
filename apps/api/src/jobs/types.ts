import type { JobType } from '@claimdesk/contracts';

/** A leased unit of work from the `jobs` collection. */
export interface Job<TPayload = unknown> {
  id: string;
  type: JobType;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  availableAt: Date;
  lockedAt?: Date | undefined;
  lockedBy?: string | undefined;
  /** Optional key that makes enqueueing the same logical job twice a no-op. */
  idempotencyKey?: string | undefined;
}

export interface JobContext {
  correlationId: string;
  attempt: number;
  signal: AbortSignal;
}

export type JobHandler<TPayload = unknown> = (
  payload: TPayload,
  context: JobContext,
) => Promise<void>;

export type JobRegistry = Map<JobType, JobHandler>;
