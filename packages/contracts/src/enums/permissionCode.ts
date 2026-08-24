/**
 * The 16 permission codes from design/07-permission-matrix.md §5.
 *
 * Holding a permission is NEVER sufficient on its own. Authorization is a
 * 5-part conjunction (§3): authenticated active employee AND permission AND
 * resource relationship AND valid entity state AND no segregation-of-duties
 * conflict. See @claimdesk/domain/authz.
 */
export const PermissionCode = {
  EXPENSE_CREATE: 'expense:create',
  EXPENSE_READ_OWN: 'expense:read:own',
  EXPENSE_UPDATE_OWN: 'expense:update:own',
  CLAIM_CREATE: 'claim:create',
  CLAIM_SUBMIT: 'claim:submit',
  CLAIM_READ_OWN: 'claim:read:own',
  APPROVAL_READ_ASSIGNED: 'approval:read:assigned',
  APPROVAL_DECIDE_ASSIGNED: 'approval:decide:assigned',
  FINANCE_REVIEW: 'finance:review',
  FINANCE_VERIFY: 'finance:verify',
  PAYMENT_MANAGE: 'payment:manage',
  POLICY_MANAGE: 'policy:manage',
  WORKFLOW_MANAGE: 'workflow:manage',
  MASTER_MANAGE: 'master:manage',
  AUDIT_READ: 'audit:read',
  REPORT_READ: 'report:read',
} as const;

export type PermissionCode = (typeof PermissionCode)[keyof typeof PermissionCode];

export const PERMISSION_CODES = Object.values(PermissionCode) as readonly PermissionCode[];
