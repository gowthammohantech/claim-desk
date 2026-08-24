/** Background job lifecycle. DEAD_LETTER is terminal until an Admin retries it — design/11 §8 forbids silently dropping integration events. */
export const JobStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const JOB_STATUSES = Object.values(JobStatus) as readonly JobStatus[];
