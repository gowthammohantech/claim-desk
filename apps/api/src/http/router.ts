import { Router, type RequestHandler } from 'express';

import { buildHealthModule } from '../modules/health/index.js';

/**
 * Mounts every module router under `/v1`.
 *
 * Routers arrive PRE-BUILT from `main.ts` rather than being constructed here.
 * `http/` is lint-restricted to importing a module's public entry point, so it
 * cannot reach the repositories a module needs — and that turns out to be the
 * right shape anyway: component tests build modules with fake repositories and
 * hand them straight in, with no HTTP surgery.
 */
export interface MountedRouters {
  /** Mounted before `authenticate` — OTP handshake, refresh, health. */
  public: Router[];
  /** Mounted after `authenticate`. */
  authenticated: Router[];
}

export interface RouterDeps {
  role: string;
  version: string;
  startedAtMs: number;
  routers: MountedRouters;
  authenticate: RequestHandler;
}

export function buildRouter(deps: RouterDeps): Router {
  const router = Router();

  router.use(buildHealthModule(deps).router);
  for (const publicRouter of deps.routers.public) router.use(publicRouter);

  // Everything past this point requires a valid access token.
  router.use(deps.authenticate);
  for (const authenticatedRouter of deps.routers.authenticated) router.use(authenticatedRouter);

  return router;
}
