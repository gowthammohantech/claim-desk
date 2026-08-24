import type { RoleCode } from '@claimdesk/contracts';
import type { Actor } from '@claimdesk/domain';

/**
 * Request augmentation for the authenticated caller.
 *
 * `Actor` is the shared type from @claimdesk/domain, so route guards evaluate
 * permissions with the same helpers the clients use to hide actions.
 */
declare global {
  namespace Express {
    interface Request {
      actor?: Actor;
      actorClaims?: { employeeCode: string; roles: readonly RoleCode[] };
    }
  }
}

export {};
