import { startHttpServer } from './http/server.js';
import { assertProductionReady, loadEnv } from './platform/config/index.js';
import { connectMongo } from './platform/database/index.js';
import { createLogger } from './platform/observability/index.js';
import { startWorker } from './worker/runner.js';

/**
 * Single entrypoint for all three runtimes. `ROLE` selects one:
 *
 *   api     (default) HTTP server
 *   worker            Mongo job + outbox pollers
 *   migrate           index creation and data migrations, then exit
 *
 * One image, one build. The API and the worker still deploy as separate
 * Container Apps and scale independently (design/12-deployment-architecture.md).
 *
 * Migrations deliberately run through this entrypoint so they execute from the
 * deployment pipeline, never from a developer machine (TDD §29).
 */
const VERSION = process.env['npm_package_version'] ?? '0.1.0';
const startedAtMs = Date.now();

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env);

  if (env.NODE_ENV === 'production') assertProductionReady(env);

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'process.unhandled_rejection');
    process.exit(1);
  });
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'process.uncaught_exception');
    process.exit(1);
  });

  // A missing MONGODB_URI is tolerated so the skeleton boots; a URI that is set
  // but unreachable is a hard failure, because that means misconfiguration.
  await connectMongo(env, logger);

  switch (env.ROLE) {
    case 'worker': {
      startWorker(env, logger);
      return;
    }

    case 'migrate': {
      logger.info('migrate.started');
      // TODO(migrations): run platform/database/migrations/runner.ts, then
      // apply the index specs from design/04-data-model.md §4.
      logger.warn('migrate.no_migrations_defined');
      logger.info('migrate.completed');
      process.exit(0);
      break;
    }

    default: {
      startHttpServer({ env, logger, version: VERSION, startedAtMs });
    }
  }
}

main().catch((error: unknown) => {
  // The logger may not exist yet (config parse failure), so use stderr.
  console.error('Fatal startup error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
