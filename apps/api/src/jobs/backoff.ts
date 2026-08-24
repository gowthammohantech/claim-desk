/**
 * Exponential backoff with full jitter.
 *
 * Jitter matters here: without it, a burst of jobs that all fail against the
 * same downstream (say the OCR provider) retries in lockstep and hammers it on
 * every wave.
 */
export interface BackoffOptions {
  baseMs?: number;
  maxMs?: number;
  random?: () => number;
}

export function backoffMs(attempt: number, options: BackoffOptions = {}): number {
  const { baseMs = 1000, maxMs = 5 * 60_000, random = Math.random } = options;
  const exponential = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(random() * exponential);
}

/** When a job should next become visible after a failed attempt. */
export function nextAvailableAt(
  attempt: number,
  now: Date,
  options: BackoffOptions = {},
): Date {
  return new Date(now.getTime() + backoffMs(attempt, options));
}
