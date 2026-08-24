import type { Server } from 'node:http';

import { disconnectMongo } from '../platform/database/index.js';
import { type AppDeps, createApp } from './app.js';

const SHUTDOWN_GRACE_MS = 10_000;

export type StartServerDeps = AppDeps;

/**
 * Starts the HTTP server and installs a graceful shutdown.
 *
 * Container Apps sends SIGTERM and then kills the container, so in-flight
 * requests must be allowed to finish or a rolling deploy will 502 users
 * mid-submission.
 */
export function startHttpServer(deps: StartServerDeps): Server {
  const { env, logger } = deps;
  const app = createApp(deps);

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, role: env.ROLE }, 'http.listening');
  });

  let shuttingDown = false;

  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'http.shutdown_started');

    const forceExit = setTimeout(() => {
      logger.error('http.shutdown_timeout — forcing exit');
      process.exit(1);
    }, SHUTDOWN_GRACE_MS);
    forceExit.unref();

    server.close(() => {
      void disconnectMongo()
        .catch((error: unknown) => {
          logger.error({ err: error }, 'mongo.disconnect_failed');
        })
        .finally(() => {
          clearTimeout(forceExit);
          logger.info('http.shutdown_complete');
          process.exit(0);
        });
    });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  return server;
}
