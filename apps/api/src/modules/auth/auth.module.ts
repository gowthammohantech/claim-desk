import type { Router } from 'express';

import type { UnitOfWork } from '../../platform/database/index.js';
import type { JwtService } from '../../platform/security/index.js';
import type { Clock } from '../../platform/util/index.js';
import type { EmployeeRepository } from '../employee/index.js';
import type { MasterDataRepository } from '../master-data/index.js';
import { authRoutes, profileRoutes } from './api/index.js';
import {
  type AuthService,
  type OtpSender,
  createAuthService,
  resolvePermissionsFromRoles,
} from './application/index.js';
import {
  createMongoOtpChallengeRepository,
  createMongoRefreshTokenRepository,
} from './infrastructure/index.js';

/**
 * Auth module. Owns `otpChallenges` and `refreshTokens`.
 *
 * Mobile number + OTP (ADR-007); the OTP sender is injected so the dummy
 * adapter can be swapped for a real SMS provider without touching this module.
 */
export interface AuthModuleDeps {
  employees: EmployeeRepository;
  masterData: MasterDataRepository;
  otpSender: OtpSender;
  jwt: JwtService;
  uow: UnitOfWork;
  clock: Clock;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  refreshTtl: string;
}

export interface AuthModule {
  router: Router;
  authenticatedRouter: Router;
  auth: AuthService;
}

export function buildAuthModule(deps: AuthModuleDeps): AuthModule {
  const auth = createAuthService({
    employees: deps.employees,
    otpChallenges: createMongoOtpChallengeRepository(),
    refreshTokens: createMongoRefreshTokenRepository(),
    otpSender: deps.otpSender,
    jwt: deps.jwt,
    uow: deps.uow,
    clock: deps.clock,
    otpTtlSeconds: deps.otpTtlSeconds,
    otpMaxAttempts: deps.otpMaxAttempts,
    refreshTtl: deps.refreshTtl,
    resolvePermissions: resolvePermissionsFromRoles,
  });

  return {
    // Unauthenticated: the OTP handshake and refresh.
    router: authRoutes(auth),
    // Behind `authenticate`: profile reads.
    authenticatedRouter: profileRoutes(deps.employees, deps.masterData),
    auth,
  };
}
