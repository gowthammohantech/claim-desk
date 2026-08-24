import { type PermissionCode, RoleCode } from '@claimdesk/contracts';
import { type Actor, hasPermission } from '@claimdesk/domain';

/**
 * Placeholder session until the auth module lands.
 *
 * The important part is the SHAPE: an `Actor` from @claimdesk/domain, so the
 * portal gates navigation with the same `hasPermission` the server enforces
 * with. Two implementations would drift.
 */
export const DEV_ACTOR: Actor = {
  employeeId: 'EMP-DEV',
  roles: [RoleCode.FINANCE, RoleCode.ADMIN],
  active: true,
};

export function useSession(): { actor: Actor; can: (p: PermissionCode) => boolean } {
  const actor = DEV_ACTOR;
  return { actor, can: (permission) => hasPermission(actor, permission) };
}
