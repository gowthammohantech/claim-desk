import { RoleCode, type PermissionCode } from '@claimdesk/contracts';
import { type Actor, hasPermission, isApprover } from '@claimdesk/domain';

/**
 * Placeholder session until the auth module lands.
 *
 * The shape is the point: an `Actor` from @claimdesk/domain so the app gates UI
 * with the same `hasPermission` the server enforces with. In particular the
 * Approvals tab is rendered only for holders of `approval:read:assigned`
 * (design/02-screen-inventory.md §3) — one binary serves both the Employee and
 * the Approver persona.
 */
export const DEV_ACTOR: Actor = {
  employeeId: 'EMP-10428',
  roles: [RoleCode.EMPLOYEE, RoleCode.REPORTING_MANAGER],
  active: true,
};

export function useSession(): {
  actor: Actor;
  can: (permission: PermissionCode) => boolean;
  isApprover: boolean;
} {
  const actor = DEV_ACTOR;
  return {
    actor,
    can: (permission) => hasPermission(actor, permission),
    isApprover: isApprover(actor),
  };
}
