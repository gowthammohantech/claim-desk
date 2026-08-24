import type { RequestHandler } from 'express';

import { authenticate } from './http/middleware/authenticate.js';
import type { MountedRouters } from './http/router.js';
import { createJobQueue } from './jobs/index.js';
import type { JobQueue } from './jobs/index.js';
import { createDummyOtpAdapter } from './integrations/index.js';
import { buildAuditModule } from './modules/audit/index.js';
import { buildAuthModule } from './modules/auth/index.js';
import { buildEmployeeModule } from './modules/employee/index.js';
import { buildMasterDataModule } from './modules/master-data/index.js';
import { writeOutboxEvents } from './outbox/index.js';
import type { Env } from './platform/config/index.js';
import { type UnitOfWork, createMongoUnitOfWork } from './platform/database/index.js';
import type { AppLogger } from './platform/observability/logger.js';
import { type JwtService, createJwtService } from './platform/security/index.js';
import { systemClock } from './platform/util/index.js';

/**
 * The composition root.
 *
 * This is the ONLY file allowed to see modules, integrations, http and worker
 * together — every other layer is lint-restricted. Concretely:
 *
 *  - `http/` may only import a module's public `index.ts`, so it cannot build
 *    repositories; routers are constructed here and handed in.
 *  - `worker/` may not import `integrations/`, so the job registry with real
 *    handlers is assembled here too.
 *  - `platform/` may not import any module, so the audit and outbox writers are
 *    injected into the unit of work here.
 *
 * The constraint turns out to be a feature: component tests build the same
 * container shape with fake repositories and no HTTP surgery.
 */
export interface Container {
  uow: UnitOfWork;
  jwt: JwtService;
  jobs: JobQueue;
  routers: MountedRouters;
  authenticate: RequestHandler;
}

export function buildContainer(env: Env, logger: AppLogger): Container {
  // ─── platform ─────────────────────────────────────────────────────────────
  const audit = buildAuditModule();

  const uow = createMongoUnitOfWork({
    clock: systemClock,
    writers: {
      writeAuditEvents: audit.writeAuditEvents,
      writeOutboxEvents,
    },
  });

  const jwt = createJwtService(env);
  const jobs = createJobQueue(env.WORKER_MAX_ATTEMPTS);

  // ─── modules ──────────────────────────────────────────────────────────────
  const employee = buildEmployeeModule();
  const masterData = buildMasterDataModule();

  const auth = buildAuthModule({
    employees: employee.employees,
    masterData: masterData.masterData,
    otpSender: createDummyOtpAdapter({ logger, fixedCode: env.OTP_DUMMY_CODE }),
    jwt,
    uow,
    clock: systemClock,
    otpTtlSeconds: env.OTP_TTL_SECONDS,
    otpMaxAttempts: env.OTP_MAX_ATTEMPTS,
    refreshTtl: env.JWT_REFRESH_TTL,
  });

  return {
    uow,
    jwt,
    jobs,
    authenticate: authenticate(jwt),
    routers: {
      public: [auth.router],
      authenticated: [auth.authenticatedRouter],
    },
  };
}
