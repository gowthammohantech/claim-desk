import { PermissionCode, RoleCode } from '@claimdesk/contracts';

/**
 * Role -> permission grants, transcribed from design/07-permission-matrix.md §2.
 *
 * IMPORTANT: holding a permission is never sufficient. §3 requires ALL FIVE of:
 *   1. authenticated active employee
 *   2. permission                       <- this file
 *   3. resource relationship            <- scope.ts
 *   4. valid entity state               <- claim/stateMachine.ts
 *   5. no segregation-of-duties conflict <- sod.ts
 *
 * Two matrix cells are deliberately NOT granted here:
 *   - Admin "support*" over the finance queue
 *   - Admin "config*" over payment batches
 * The matrix footnote says both "must be separately granted and audited", so
 * they are per-employee grants, never implied by the Admin role.
 *
 * `audit:read` and `report:read` are granted broadly because the matrix scopes
 * them by row ("own", "scoped") rather than withholding them; scope.ts narrows
 * the result set.
 */

const EMPLOYEE_SELF_SERVICE = [
  PermissionCode.EXPENSE_CREATE,
  PermissionCode.EXPENSE_READ_OWN,
  PermissionCode.EXPENSE_UPDATE_OWN,
  PermissionCode.CLAIM_CREATE,
  PermissionCode.CLAIM_SUBMIT,
  PermissionCode.CLAIM_READ_OWN,
  PermissionCode.AUDIT_READ,
  PermissionCode.REPORT_READ,
] as const;

const APPROVER = [
  ...EMPLOYEE_SELF_SERVICE,
  PermissionCode.APPROVAL_READ_ASSIGNED,
  PermissionCode.APPROVAL_DECIDE_ASSIGNED,
] as const;

export const ROLE_PERMISSIONS: Readonly<Record<RoleCode, readonly PermissionCode[]>> = {
  [RoleCode.EMPLOYEE]: EMPLOYEE_SELF_SERVICE,
  [RoleCode.REPORTING_MANAGER]: APPROVER,
  [RoleCode.ENGAGEMENT_MANAGER]: APPROVER,
  [RoleCode.PARTNER]: APPROVER,
  [RoleCode.FINANCE]: [
    PermissionCode.CLAIM_READ_OWN,
    PermissionCode.FINANCE_REVIEW,
    PermissionCode.FINANCE_VERIFY,
    PermissionCode.PAYMENT_MANAGE,
    PermissionCode.AUDIT_READ,
    PermissionCode.REPORT_READ,
  ],
  [RoleCode.ADMIN]: [
    PermissionCode.POLICY_MANAGE,
    PermissionCode.WORKFLOW_MANAGE,
    PermissionCode.MASTER_MANAGE,
    PermissionCode.AUDIT_READ,
    PermissionCode.REPORT_READ,
  ],
  [RoleCode.AUDITOR]: [PermissionCode.AUDIT_READ, PermissionCode.REPORT_READ],
};

/** The minimal actor shape the authorization helpers need. */
export interface Actor {
  employeeId: string;
  roles: readonly RoleCode[];
  /** Inactive employees fail check 1 regardless of role. */
  active: boolean;
  /**
   * Per-employee grants beyond the role matrix — the "support*" and "config*"
   * cells. Must be separately granted and audited.
   */
  extraPermissions?: readonly PermissionCode[];
}

/** Every permission an actor holds, from roles plus explicit extra grants. */
export function permissionsOf(actor: Pick<Actor, 'roles' | 'extraPermissions'>): Set<PermissionCode> {
  const granted = new Set<PermissionCode>();
  for (const role of actor.roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) granted.add(permission);
  }
  for (const permission of actor.extraPermissions ?? []) granted.add(permission);
  return granted;
}

/**
 * Check 1 + 2 only. Callers MUST also apply scope, entity state and SoD before
 * allowing an action — see the module docblock.
 */
export function hasPermission(actor: Actor, permission: PermissionCode): boolean {
  if (!actor.active) return false;
  return permissionsOf(actor).has(permission);
}

/** True when the actor holds every listed permission. */
export function hasAllPermissions(
  actor: Actor,
  permissions: readonly PermissionCode[],
): boolean {
  if (!actor.active) return false;
  const granted = permissionsOf(actor);
  return permissions.every((p) => granted.has(p));
}

/** True when the actor holds at least one of the listed permissions. */
export function hasAnyPermission(
  actor: Actor,
  permissions: readonly PermissionCode[],
): boolean {
  if (!actor.active) return false;
  const granted = permissionsOf(actor);
  return permissions.some((p) => granted.has(p));
}

/** True when the actor can act on approvals — drives the mobile Approvals tab. */
export function isApprover(actor: Actor): boolean {
  return hasPermission(actor, PermissionCode.APPROVAL_READ_ASSIGNED);
}
