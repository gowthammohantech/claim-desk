/**
 * @claimdesk/domain — logic shared by the API, the web portal and the mobile app.
 *
 * What lives here: money arithmetic and formatting, the authorization model
 * (permissions, resource scope, segregation of duties), the claim and expense
 * state machines, and the request-validation schemas.
 *
 * What deliberately does NOT live here, and must stay backend-only:
 *   - the policy rule evaluator  (design/09-policy-engine-spec.md §1 forbids
 *     embedding firm policy in mobile/web code — clients consume outcomes via
 *     POST /expenses/{id}/evaluate, never the rules)
 *   - workflow route resolution
 *   - duplicate scoring
 *   - audit and outbox writing
 *   - integration adapters
 *
 * `index.test.ts` enforces that ban.
 */

// ─── money ──────────────────────────────────────────────────────────────────
export {
  MAX_AMOUNT_PAISE,
  MoneyError,
  PAISE_PER_RUPEE,
  assertPaise,
  isValidPaise,
  roundHalfUp,
  splitPaise,
  sumPaise,
  toPaise,
  toRupees,
} from './money/paise.js';
export {
  type FormatPaiseOptions,
  formatPaise,
  formatPaiseCompact,
  groupIndian,
} from './money/format.js';
export { MAX_DISTANCE_KM, type MileageInput, computeMileagePaise } from './money/mileage.js';

// ─── authorization ──────────────────────────────────────────────────────────
export {
  type Actor,
  ROLE_PERMISSIONS,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isApprover,
  permissionsOf,
} from './authz/permissions.js';
export {
  type AssignableTask,
  type OwnedResource,
  canReadClaim,
  isAdminScope,
  isAssignedApprover,
  isFinanceScope,
  isOwner,
} from './authz/scope.js';
export {
  SOD_GUARDED_ACTIONS,
  type SodGuardedAction,
  type SodViolation,
  cannotActOnOwnClaim,
  checkSelfAction,
} from './authz/sod.js';

// ─── state machines ─────────────────────────────────────────────────────────
export {
  CLAIM_TRANSITIONS,
  ClaimTransitionError,
  EXPENSE_TRANSITIONS,
  IN_FLIGHT_CLAIM_STATUSES,
  TERMINAL_CLAIM_STATUSES,
  allowedTransitions,
  assertTransition,
  canTransition,
  canTransitionExpense,
  isClaimable,
  isEditableByOwner,
  isTerminal,
} from './claim/stateMachine.js';

// ─── validation schemas ─────────────────────────────────────────────────────
export * from './schemas/index.js';
