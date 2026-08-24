import { type Router } from 'express';

import { mongoStatus } from '../../platform/database/index.js';
import { systemClock } from '../../platform/util/index.js';
import { healthRoutes } from './api/health.routes.js';
import {
  type DependencyState,
  type HealthCheck,
  createGetHealth,
} from './application/getHealth.usecase.js';

export interface HealthModuleDeps {
  role: string;
  version: string;
  startedAtMs: number;
}

/** Maps the Mongo connection state onto the health vocabulary. */
const mongoCheck: HealthCheck = {
  name: 'mongo',
  critical: false,
  check: (): DependencyState => {
    switch (mongoStatus()) {
      case 'connected':
        return 'ok';
      case 'skipped':
        return 'skipped';
      case 'disconnected':
        return 'degraded';
      default:
        return 'down';
    }
  },
};

export function buildHealthModule(deps: HealthModuleDeps): { router: Router } {
  const getHealth = createGetHealth({
    ...deps,
    nowMs: () => systemClock.nowMs(),
    checks: [mongoCheck],
  });

  return { router: healthRoutes(getHealth) };
}
