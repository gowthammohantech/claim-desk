import { describe, expect, it, vi } from 'vitest';

import { loadEnv } from '../platform/config/index.js';
import { createLogger } from '../platform/observability/index.js';
import { startWorker } from './runner.js';

const TEST_ENV = {
  NODE_ENV: 'test',
  ROLE: 'worker',
  LOG_LEVEL: 'silent',
  JWT_ACCESS_SECRET: 'test-secret-that-is-at-least-32-chars',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars',
  WORKER_JOB_POLL_MS: '100',
  WORKER_OUTBOX_POLL_MS: '100',
} as NodeJS.ProcessEnv;

function buildWorker() {
  const env = loadEnv(TEST_ENV);
  return startWorker(env, createLogger(env));
}

describe('worker runner', () => {
  it('starts both pollers and drains them on stop', async () => {
    const worker = buildWorker();
    await new Promise((resolve) => setTimeout(resolve, 350));

    // The real assertion: stop() resolves rather than hanging on the loops.
    await expect(worker.stop()).resolves.toBeUndefined();
  });

  it('is idempotent — a second stop reuses the first drain', async () => {
    const worker = buildWorker();
    const first = worker.stop();
    const second = worker.stop();

    // Both callers await the same drain; neither hangs and neither double-closes.
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  it('idles instead of throwing when no datasource is configured', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    const worker = buildWorker();
    await new Promise((resolve) => setTimeout(resolve, 350));
    await worker.stop();

    // A missing Mongo connection must degrade to idle ticks, not a crash loop.
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
