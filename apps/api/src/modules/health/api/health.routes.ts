import { Router } from 'express';

import type { GetHealth } from '../application/getHealth.usecase.js';

/**
 * `/health` is deliberately unauthenticated and is the only route the API
 * exposes without a bearer token besides the OTP endpoints.
 *
 * Note for the API quality gate: design/13-test-strategy.md §4 forbids
 * undocumented production endpoints, and this route is NOT in
 * design/06-api-contract.yaml. Either add it there or move liveness/readiness
 * to the ops port. Tracked in the repo README as a known gap.
 */
export function healthRoutes(getHealth: GetHealth): Router {
  const router = Router();

  router.get('/health', (_req, res, next) => {
    getHealth()
      .then((report) => {
        res.status(report.status === 'down' ? 503 : 200).json(report);
      })
      .catch(next);
  });

  return router;
}
