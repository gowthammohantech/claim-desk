import { Router } from 'express';

import { buildHealthModule } from '../modules/health/index.js';

export interface RouterDeps {
  role: string;
  version: string;
  startedAtMs: number;
}

/**
 * Mounts every module router under `/v1`.
 *
 * As modules gain routes, each one contributes `buildXModule(...).router` here
 * and nowhere else — a module's internals are never reachable from the HTTP
 * layer (enforced by the boundaries entry-point rule).
 */
export function buildRouter(deps: RouterDeps): Router {
  const router = Router();

  router.use(buildHealthModule(deps).router);

  // TODO(modules): auth, employee, master-data, expense, receipt, policy, claim,
  // approval, finance, payment, notification, reporting, audit.

  return router;
}
