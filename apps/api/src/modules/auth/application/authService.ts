import { AuditEventName, EntityType, type PermissionCode, type RoleCode } from '@claimdesk/contracts';
import { type Actor, permissionsOf } from '@claimdesk/domain';

import { AppError, ErrorCode } from '../../../platform/errors/index.js';
import {
  type AccessTokenClaims,
  type JwtService,
  durationToSeconds,
  generateOtpCode,
  generateToken,
  hashToken,
  safeEquals,
} from '../../../platform/security/index.js';
import type { UnitOfWork } from '../../../platform/database/index.js';
import type { Clock } from '../../../platform/util/index.js';
import { newId } from '../../../platform/util/index.js';
import { type Employee, EmployeeStatus, normalizeMobile } from '../../employee/index.js';
import type { EmployeeRepository } from '../../employee/index.js';
import type {
  OtpChallengeRepository,
  OtpSender,
  RefreshTokenRepository,
} from './ports/authPorts.js';

/**
 * Mobile number + OTP sign-in (ADR-007, gaps.md GAP-002).
 *
 * Refresh tokens ROTATE: every refresh issues a new one and revokes its
 * predecessor. That is what makes them revocable at all — a stateless refresh
 * JWT cannot be withdrawn before it expires.
 */
export interface TokenPairResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  employee: Employee;
}

export interface AuthServiceDeps {
  employees: EmployeeRepository;
  otpChallenges: OtpChallengeRepository;
  refreshTokens: RefreshTokenRepository;
  otpSender: OtpSender;
  jwt: JwtService;
  uow: UnitOfWork;
  clock: Clock;
  otpTtlSeconds: number;
  otpMaxAttempts: number;
  refreshTtl: string;
  /** Resolves an employee's permissions from their roles. */
  resolvePermissions: (roles: readonly RoleCode[]) => PermissionCode[];
}

/**
 * A refresh presented after it was rotated is either a benign race (a mobile
 * client fired two requests at once) or replay of a stolen token. Inside this
 * window we treat it as a race; outside it, as theft, and revoke the family.
 */
const ROTATION_GRACE_MS = 30_000;

export interface AuthService {
  requestOtp(mobileNumber: string): Promise<{ devCode?: string | undefined }>;
  verifyOtp(mobileNumber: string, code: string): Promise<TokenPairResult>;
  refresh(refreshToken: string): Promise<TokenPairResult>;
  logout(refreshToken: string): Promise<void>;
}

export function createAuthService(deps: AuthServiceDeps): AuthService {
  const {
    employees,
    otpChallenges,
    refreshTokens,
    otpSender,
    jwt,
    uow,
    clock,
    otpTtlSeconds,
    otpMaxAttempts,
    refreshTtl,
    resolvePermissions,
  } = deps;

  const refreshTtlMs = durationToSeconds(refreshTtl) * 1000;

  async function issuePair(employee: Employee, familyId: string): Promise<TokenPairResult> {
    const permissions = resolvePermissions(employee.roles);
    const claims: AccessTokenClaims = {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      roles: [...employee.roles],
      permissions,
    };

    const { token: accessToken, expiresIn } = await jwt.signAccessToken(claims);

    const refreshToken = generateToken();
    const now = clock.now();
    await refreshTokens.issue({
      employeeId: employee.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(now.getTime() + refreshTtlMs),
      now,
    });

    return { accessToken, refreshToken, expiresIn, employee };
  }

  return {
    /**
     * Always resolves, whether or not the number belongs to an employee.
     *
     * Returning 404 for an unknown number would turn this endpoint into a
     * membership oracle — anyone could enumerate who works here.
     */
    async requestOtp(mobileNumber) {
      const normalized = normalizeMobile(mobileNumber);
      const employee = await employees.findByMobile(normalized);
      const now = clock.now();

      if (!employee || employee.status !== EmployeeStatus.ACTIVE) {
        return { devCode: undefined };
      }

      // One live challenge per number: requesting a new code invalidates the old.
      await otpChallenges.invalidateFor(normalized, now);

      const code = generateOtpCode();
      await otpChallenges.create({
        mobileNumber: normalized,
        codeHash: hashToken(code),
        maxAttempts: otpMaxAttempts,
        expiresAt: new Date(now.getTime() + otpTtlSeconds * 1000),
        now,
      });

      await otpSender.send(normalized, code);

      // Only a dummy adapter ever returns the code; a real provider never does.
      return { devCode: otpSender.revealsCode ? code : undefined };
    },

    async verifyOtp(mobileNumber, code) {
      const normalized = normalizeMobile(mobileNumber);
      const now = clock.now();

      const challenge = await otpChallenges.findActive(normalized, now);
      if (!challenge) {
        throw new AppError(ErrorCode.OTP_EXPIRED, 401, 'That code has expired. Request a new one.');
      }

      const attempts = await otpChallenges.recordAttempt(challenge.id);
      if (attempts > challenge.maxAttempts) {
        // Burn the challenge rather than allowing unlimited guesses.
        await otpChallenges.consume(challenge.id, now);
        throw new AppError(ErrorCode.OTP_INVALID, 401, 'Too many attempts. Request a new code.');
      }

      if (!safeEquals(hashToken(code), challenge.codeHash)) {
        throw new AppError(ErrorCode.OTP_INVALID, 401, 'That code is not correct.');
      }

      // Single-use: loses the race if two verifications arrive together.
      if (!(await otpChallenges.consume(challenge.id, now))) {
        throw new AppError(ErrorCode.OTP_INVALID, 401, 'That code has already been used.');
      }

      const employee = await employees.findByMobile(normalized);
      if (!employee || employee.status !== EmployeeStatus.ACTIVE) {
        throw new AppError(ErrorCode.UNAUTHENTICATED, 401, 'This account is not active.');
      }

      const pair = await issuePair(employee, newId());

      await uow.run({ actor: { employeeId: employee.id }, source: 'api' }, async (scope) => {
        scope.audit({
          eventName: AuditEventName.AUTH_LOGIN_SUCCEEDED,
          entityType: EntityType.EMPLOYEE,
          entityId: employee.id,
          payload: { provider: 'otp' },
        });
      });

      return pair;
    },

    async refresh(refreshToken) {
      const now = clock.now();
      const stored = await refreshTokens.findByHash(hashToken(refreshToken));

      if (!stored) {
        throw new AppError(ErrorCode.UNAUTHENTICATED, 401, 'That session is no longer valid.');
      }

      if (stored.expiresAt <= now) {
        throw new AppError(ErrorCode.UNAUTHENTICATED, 401, 'That session has expired.');
      }

      if (stored.revokedAt) {
        const rotatedRecently = now.getTime() - stored.revokedAt.getTime() <= ROTATION_GRACE_MS;

        if (!rotatedRecently) {
          /*
           * A long-revoked token is being replayed. Assume theft: revoking the
           * whole family logs out the attacker AND the legitimate holder, which
           * is the correct trade — the alternative leaves the attacker with a
           * working session.
           */
          await refreshTokens.revokeFamily(stored.familyId, now);
          throw new AppError(
            ErrorCode.UNAUTHENTICATED,
            401,
            'This session was replaced. Sign in again.',
          );
        }

        throw new AppError(ErrorCode.UNAUTHENTICATED, 401, 'That session has just been refreshed.');
      }

      const employee = await employees.findById(stored.employeeId);
      if (!employee || employee.status !== EmployeeStatus.ACTIVE) {
        await refreshTokens.revokeFamily(stored.familyId, now);
        throw new AppError(ErrorCode.UNAUTHENTICATED, 401, 'This account is not active.');
      }

      const pair = await issuePair(employee, stored.familyId);
      await refreshTokens.markRotated(stored.id, hashToken(pair.refreshToken), now);

      return pair;
    },

    async logout(refreshToken) {
      const stored = await refreshTokens.findByHash(hashToken(refreshToken));
      // Idempotent: logging out an unknown or already-revoked token succeeds.
      if (stored) await refreshTokens.revoke(stored.id, clock.now());
    },
  };
}

/** Builds the `Actor` the authorization helpers expect from a verified token. */
export function toActor(claims: {
  employeeId: string;
  roles: readonly RoleCode[];
  permissions: readonly PermissionCode[];
}): Actor {
  return {
    employeeId: claims.employeeId,
    roles: [...claims.roles],
    active: true,
    extraPermissions: [...claims.permissions],
  };
}

/** Role -> permission resolution, from the shared matrix. */
export function resolvePermissionsFromRoles(roles: readonly RoleCode[]): PermissionCode[] {
  return [...permissionsOf({ roles: [...roles] })];
}
