import type { Env } from '../platform/config/index.js';
import { disconnectMongo, mongoStatus } from '../platform/database/index.js';
import type { AppLogger } from '../platform/observability/logger.js';
import { buildJobRegistry } from './registry.js';

/**
 * The worker runtime.
 *
 * Same image as the API — `ROLE=worker` selects this path (design/12 §2
 * explicitly allows "same codebase or separate process"). The two still deploy
 * as separate Container Apps and scale independently.
 *
 * Two independent loops:
 *   jobs   — leases from the `jobs` collection and runs handlers
 *   outbox — drains `outbox` rows into jobs
 *
 * Both use recursive setTimeout rather than setInterval: with setInterval a
 * slow tick overlaps the next one, and two overlapping pollers will
 * double-lease.
 */
export interface WorkerHandle {
  stop: () => Promise<void>;
}

interface LoopDeps {
  name: 'jobs' | 'outbox';
  intervalMs: number;
  logger: AppLogger;
  signal: AbortSignal;
  tick: () => Promise<void>;
}

function startLoop({ name, intervalMs, logger, signal, tick }: LoopDeps): Promise<void> {
  return new Promise<void>((resolve) => {
    let timer: NodeJS.Timeout | undefined;

    const stop = (): void => {
      if (timer) clearTimeout(timer);
      resolve();
    };

    const run = async (): Promise<void> => {
      if (signal.aborted) return stop();
      try {
        await tick();
      } catch (error) {
        logger.error({ err: error, loop: name }, 'worker.tick_failed');
      }
      if (signal.aborted) return stop();
      timer = setTimeout(() => void run(), intervalMs);
    };

    signal.addEventListener('abort', stop, { once: true });
    void run();
  });
}

export function startWorker(env: Env, logger: AppLogger): WorkerHandle {
  const controller = new AbortController();
  const registry = buildJobRegistry(logger);

  logger.info(
    {
      handlers: registry.size,
      pollers: ['jobs', 'outbox'],
      concurrency: env.WORKER_CONCURRENCY,
      leaseMs: env.WORKER_LEASE_MS,
    },
    'worker.started',
  );

  const hasDatasource = (): boolean => mongoStatus() === 'connected';

  const jobsLoop = startLoop({
    name: 'jobs',
    intervalMs: env.WORKER_JOB_POLL_MS,
    logger,
    signal: controller.signal,
    tick: async () => {
      if (!hasDatasource()) {
        logger.debug({ loop: 'jobs', reason: 'no-datasource' }, 'worker.idle_tick');
        return;
      }
      // TODO(jobs): lease up to WORKER_BATCH_SIZE due jobs via findOneAndUpdate
      // on { status: 'pending', availableAt: { $lte: now } }, run them through
      // `registry`, then release or dead-letter using nextAvailableAt().
      logger.debug({ loop: 'jobs' }, 'worker.idle_tick');
    },
  });

  const outboxLoop = startLoop({
    name: 'outbox',
    intervalMs: env.WORKER_OUTBOX_POLL_MS,
    logger,
    signal: controller.signal,
    tick: async () => {
      if (!hasDatasource()) {
        logger.debug({ loop: 'outbox', reason: 'no-datasource' }, 'worker.idle_tick');
        return;
      }
      // TODO(outbox): read undispatched rows oldest-first, enqueue the matching
      // job, then stamp dispatchedAt.
      logger.debug({ loop: 'outbox' }, 'worker.idle_tick');
    },
  });

  let stopping: Promise<void> | undefined;

  const stop = async (): Promise<void> => {
    stopping ??= (async () => {
      const startedAt = Date.now();
      logger.info('worker.stopping');
      controller.abort();
      await Promise.all([jobsLoop, outboxLoop]);
      await disconnectMongo();
      logger.info({ drainMs: Date.now() - startedAt }, 'worker.stopped');
    })();
    return stopping;
  };

  const onSignal = (signal: string): void => {
    logger.info({ signal }, 'worker.signal');
    void stop().then(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    onSignal('SIGTERM');
  });
  process.on('SIGINT', () => {
    onSignal('SIGINT');
  });

  return { stop };
}
