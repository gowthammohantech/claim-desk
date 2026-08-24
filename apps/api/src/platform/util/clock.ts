/**
 * Injectable clock. Job leasing, OTP expiry and SLA maths are all time-based;
 * taking the clock as a dependency keeps those unit-testable without faking
 * timers globally.
 *
 * All timestamps are UTC (design/01-HFD.md §11). Rendering in a local timezone
 * is a client concern.
 */
export interface Clock {
  now(): Date;
  nowMs(): number;
}

export const systemClock: Clock = {
  now: () => new Date(),
  nowMs: () => Date.now(),
};

/** Fixed clock for tests. */
export function fixedClock(at: Date): Clock {
  return { now: () => new Date(at), nowMs: () => at.getTime() };
}
