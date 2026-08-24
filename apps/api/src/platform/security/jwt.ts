import type { PermissionCode, RoleCode } from '@claimdesk/contracts';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import type { Env } from '../config/env.js';

/**
 * Access tokens (ADR-007: mobile number + OTP, backend issues app tokens).
 *
 * Claims carry roles AND the resolved permission list. Embedding permissions
 * costs a few hundred bytes and saves a database read on every request, but it
 * means a role change does not take effect until the access token expires —
 * which is why access tokens are short-lived (15m) and refresh is where
 * revocation actually bites.
 */
export const TOKEN_ISSUER = 'claimdesk';
export const TOKEN_AUDIENCE = 'claimdesk-app';

export interface AccessTokenClaims {
  employeeId: string;
  employeeCode: string;
  roles: RoleCode[];
  permissions: PermissionCode[];
}

export interface VerifiedAccessToken extends AccessTokenClaims {
  expiresAt: Date;
}

export interface JwtService {
  signAccessToken(claims: AccessTokenClaims): Promise<{ token: string; expiresIn: number }>;
  verifyAccessToken(token: string): Promise<VerifiedAccessToken>;
}

export class InvalidTokenError extends Error {
  constructor(message = 'The access token is missing, expired or invalid.') {
    super(message);
    this.name = 'InvalidTokenError';
  }
}

/** `15m` / `24h` / `30d` -> seconds. */
export function durationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match?.[1] || !match[2]) throw new Error(`Unsupported duration: ${duration}`);
  const value = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86_400;
  return value * multiplier;
}

export function createJwtService(env: Env): JwtService {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const expiresIn = durationToSeconds(env.JWT_ACCESS_TTL);

  return {
    async signAccessToken(claims) {
      const now = Math.floor(Date.now() / 1000);
      const token = await new SignJWT({
        employeeCode: claims.employeeCode,
        roles: claims.roles,
        permissions: claims.permissions,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(claims.employeeId)
        .setIssuer(TOKEN_ISSUER)
        .setAudience(TOKEN_AUDIENCE)
        .setIssuedAt(now)
        .setExpirationTime(now + expiresIn)
        .sign(secret);

      return { token, expiresIn };
    },

    async verifyAccessToken(token) {
      let payload: JWTPayload;
      try {
        // Issuer and audience are checked here, not after: an attacker who
        // obtains a token minted for a different audience must not be able to
        // present it to this API.
        ({ payload } = await jwtVerify(token, secret, {
          issuer: TOKEN_ISSUER,
          audience: TOKEN_AUDIENCE,
          algorithms: ['HS256'],
        }));
      } catch {
        throw new InvalidTokenError();
      }

      if (!payload.sub || !payload.exp) throw new InvalidTokenError();

      return {
        employeeId: payload.sub,
        employeeCode: String(payload['employeeCode'] ?? ''),
        roles: (payload['roles'] as RoleCode[] | undefined) ?? [],
        permissions: (payload['permissions'] as PermissionCode[] | undefined) ?? [],
        expiresAt: new Date(payload.exp * 1000),
      };
    },
  };
}
