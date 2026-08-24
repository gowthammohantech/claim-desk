import type { PermissionCode } from '@claimdesk/contracts';
import { type Actor, hasPermission } from '@claimdesk/domain';
import type { RequestHandler } from 'express';

import { AppError, ErrorCode } from '../../platform/errors/index.js';
import { InvalidTokenError, type JwtService } from '../../platform/security/index.js';
import { setContextEmployee } from '../../platform/util/index.js';

export function authenticate(jwt: JwtService): RequestHandler {
  return (req, _res, next) => {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer ')) {
      next(AppError.unauthenticated());
      return;
    }

    jwt
      .verifyAccessToken(header.slice('Bearer '.length))
      .then((claims) => {
        req.actor = {
          employeeId: claims.employeeId,
          roles: claims.roles,
          active: true,
          extraPermissions: claims.permissions,
        };
        req.actorClaims = { employeeCode: claims.employeeCode, roles: claims.roles };
        // Every log line for the rest of this request carries the employee id.
        setContextEmployee(claims.employeeId);
        next();
      })
      .catch((error: unknown) => {
        next(
          error instanceof InvalidTokenError
            ? AppError.unauthenticated(error.message)
            : (error as Error),
        );
      });
  };
}

/** Reads the actor, or throws — for handlers that run after `authenticate`. */
export function requireActor(req: { actor?: Actor }): Actor {
  if (!req.actor) throw AppError.unauthenticated();
  return req.actor;
}

/**
 * Permission gate.
 *
 * This is check 2 of the five that design/07-permission-matrix.md §3 requires.
 * It is NEVER sufficient on its own — the use case must still verify the
 * resource relationship, the entity state and segregation of duties. Mounting
 * `authorize()` on a route and stopping there is the most likely way to ship an
 * authorization hole here.
 */
export function authorize(...permissions: PermissionCode[]): RequestHandler {
  return (req, _res, next) => {
    const actor = req.actor;
    if (!actor) {
      next(AppError.unauthenticated());
      return;
    }

    const granted = permissions.some((permission) => hasPermission(actor, permission));
    if (!granted) {
      next(
        new AppError(
          ErrorCode.FORBIDDEN,
          403,
          'You do not have permission to perform this action.',
        ),
      );
      return;
    }

    next();
  };
}
