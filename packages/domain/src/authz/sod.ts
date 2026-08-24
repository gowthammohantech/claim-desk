import { type Actor } from './permissions.js';
import { type OwnedResource, isOwner } from './scope.js';

/**
 * Check 5 of design/07-permission-matrix.md §3 — segregation of duties (§4):
 *
 *   - A claimant cannot approve their own claim.
 *   - A claimant cannot finance-verify their own claim.
 *   - A claimant cannot mark their own claim paid.
 *   - Delegation cannot bypass self-approval.
 *   - Admin configuration rights do not grant financial decision rights.
 *
 * These are hard rules. They are checked on the server AND used by the clients
 * to hide actions, which is exactly why they live in shared code — two
 * implementations would drift.
 */

export const SOD_GUARDED_ACTIONS = ['approve', 'finance-verify', 'mark-paid'] as const;
export type SodGuardedAction = (typeof SOD_GUARDED_ACTIONS)[number];

export interface SodViolation {
  action: SodGuardedAction;
  reason: string;
}

/**
 * Returns a violation when the actor is the claimant, otherwise `null`.
 *
 * Delegation is irrelevant here by design: a delegated approver who happens to
 * be the claimant is still the claimant.
 */
export function checkSelfAction(
  actor: Pick<Actor, 'employeeId'>,
  claim: OwnedResource,
  action: SodGuardedAction,
): SodViolation | null {
  if (!isOwner(actor, claim)) return null;
  return {
    action,
    reason: `Segregation of duties: a claimant cannot ${action.replace('-', ' ')} their own claim.`,
  };
}

/** True when the actor must be blocked from the action on their own claim. */
export function cannotActOnOwnClaim(
  actor: Pick<Actor, 'employeeId'>,
  claim: OwnedResource,
  action: SodGuardedAction,
): boolean {
  return checkSelfAction(actor, claim, action) !== null;
}
