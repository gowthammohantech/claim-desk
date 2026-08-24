import { PermissionCode } from '@claimdesk/contracts';

import { type Actor, hasPermission } from './permissions.js';

/**
 * Check 3 of design/07-permission-matrix.md §3 — the resource relationship.
 *
 * These predicates deliberately take only the fields they need, so they work
 * against a full document on the server and against a list DTO on the client.
 */

export interface OwnedResource {
  employeeId: string;
}

export interface AssignableTask {
  assigneeEmployeeId: string;
  /** Set when the task reached this actor through a delegation. */
  delegatedFromEmployeeId?: string | undefined;
}

/** The actor owns the resource. */
export function isOwner(actor: Pick<Actor, 'employeeId'>, resource: OwnedResource): boolean {
  return actor.employeeId === resource.employeeId;
}

/**
 * The task is assigned to this actor, either directly or via a delegation.
 *
 * Delegation is out of scope for the current release
 * (design/08-workflow-spec.md §9) but the data model carries it, so the
 * predicate handles it rather than pretending it cannot happen.
 */
export function isAssignedApprover(
  actor: Pick<Actor, 'employeeId'>,
  task: AssignableTask,
): boolean {
  return (
    task.assigneeEmployeeId === actor.employeeId ||
    task.delegatedFromEmployeeId === actor.employeeId
  );
}

/** The actor operates in the finance scope (queue, verification, payments). */
export function isFinanceScope(actor: Actor): boolean {
  return (
    hasPermission(actor, PermissionCode.FINANCE_REVIEW) ||
    hasPermission(actor, PermissionCode.FINANCE_VERIFY) ||
    hasPermission(actor, PermissionCode.PAYMENT_MANAGE)
  );
}

/** The actor administers configuration (policies, workflows, master data). */
export function isAdminScope(actor: Actor): boolean {
  return (
    hasPermission(actor, PermissionCode.POLICY_MANAGE) ||
    hasPermission(actor, PermissionCode.WORKFLOW_MANAGE) ||
    hasPermission(actor, PermissionCode.MASTER_MANAGE)
  );
}

/**
 * Whether the actor may read a given claim at all: owner, assigned approver,
 * finance scope, or a read-only auditor.
 */
export function canReadClaim(
  actor: Actor,
  claim: OwnedResource,
  assignedTasks: readonly AssignableTask[] = [],
): boolean {
  if (!actor.active) return false;
  if (isOwner(actor, claim) && hasPermission(actor, PermissionCode.CLAIM_READ_OWN)) return true;
  if (
    hasPermission(actor, PermissionCode.APPROVAL_READ_ASSIGNED) &&
    assignedTasks.some((task) => isAssignedApprover(actor, task))
  ) {
    return true;
  }
  if (isFinanceScope(actor)) return true;
  return hasPermission(actor, PermissionCode.AUDIT_READ) && isAdminScope(actor);
}
