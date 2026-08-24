import { API_VERSION_PREFIX } from '@claimdesk/contracts';
import compression from 'compression';
import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';

import type { Env } from '../platform/config/index.js';
import type { AppLogger } from '../platform/observability/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { httpLogger } from './middleware/httpLogger.js';
import { requestContext } from './middleware/requestContext.js';
import { type MountedRouters, buildRouter } from './router.js';

export interface AppDeps {
  env: Env;
  logger: AppLogger;
  version: string;
  startedAtMs: number;
  /** Built by `main.ts` — see the note in router.ts about why. */
  routers: MountedRouters;
  authenticate: RequestHandler;
}

/**
 * Builds the Express app WITHOUT listening, so component tests can drive it
 * through supertest (design/13-test-strategy.md §2: component tests mock only
 * at external boundaries).
 */
export function createApp({
  env,
  logger,
  version,
  startedAtMs,
  routers,
  authenticate,
}: AppDeps): Express {
  const app = express();

  app.disable('x-powered-by');
  // Container Apps / Front Door sit in front, so trust the proxy for client IPs.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  // Context first: everything downstream logs with the correlation id.
  app.use(requestContext);
  app.use(httpLogger(logger));

  app.use(
    API_VERSION_PREFIX,
    buildRouter({ role: env.ROLE, version, startedAtMs, routers, authenticate }),
  );

  app.use(notFound);
  app.use(errorHandler(logger));

  return app;
}
