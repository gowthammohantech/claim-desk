import { PermissionCode, RoleCode } from '@claimdesk/contracts';
import { describe, expect, it } from 'vitest';

import { type Actor, ROLE_PERMISSIONS, hasPermission, isApprover } from './permissions.js';
import { canReadClaim, isAssignedApprover, isFinanceScope, isOwner } from './scope.js';
import { cannotActOnOwnClaim, checkSelfAction } from './sod.js';

const actor = (over: Partial<Actor> = {}): Actor => ({
  employeeId: 'EMP-1',
  roles: [RoleCode.EMPLOYEE],
  active: true,
  ...over,
});

describe('role -> permission matrix (design/07-permission-matrix.md §2)', () => {
  it('gives an employee self-service but no approval or finance rights', () => {
    const a = actor();
    expect(hasPermission(a, PermissionCode.EXPENSE_CREATE)).toBe(true);
    expect(hasPermission(a, PermissionCode.CLAIM_SUBMIT)).toBe(true);
    expect(hasPermission(a, PermissionCode.APPROVAL_DECIDE_ASSIGNED)).toBe(false);
    expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(false);
  });

  it.each([RoleCode.REPORTING_MANAGER, RoleCode.ENGAGEMENT_MANAGER, RoleCode.PARTNER])(
    '%s can decide assigned approvals and still act as an employee',
    (role) => {
      const a = actor({ roles: [role] });
      expect(hasPermission(a, PermissionCode.APPROVAL_DECIDE_ASSIGNED)).toBe(true);
      expect(hasPermission(a, PermissionCode.EXPENSE_CREATE)).toBe(true);
      expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(false);
      expect(isApprover(a)).toBe(true);
    },
  );

  it('gives finance verification and payment rights but no approval rights', () => {
    const a = actor({ roles: [RoleCode.FINANCE] });
    expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(true);
    expect(hasPermission(a, PermissionCode.PAYMENT_MANAGE)).toBe(true);
    expect(hasPermission(a, PermissionCode.APPROVAL_DECIDE_ASSIGNED)).toBe(false);
    expect(isFinanceScope(a)).toBe(true);
  });

  it('does NOT let admin config rights imply financial decision rights', () => {
    // Matrix footnote: Admin's finance "support*" and payment "config*" cells
    // must be separately granted and audited.
    const a = actor({ roles: [RoleCode.ADMIN] });
    expect(hasPermission(a, PermissionCode.POLICY_MANAGE)).toBe(true);
    expect(hasPermission(a, PermissionCode.WORKFLOW_MANAGE)).toBe(true);
    expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(false);
    expect(hasPermission(a, PermissionCode.PAYMENT_MANAGE)).toBe(false);
    expect(hasPermission(a, PermissionCode.APPROVAL_DECIDE_ASSIGNED)).toBe(false);
  });

  it('honours separately-granted extra permissions', () => {
    const a = actor({
      roles: [RoleCode.ADMIN],
      extraPermissions: [PermissionCode.FINANCE_REVIEW],
    });
    expect(hasPermission(a, PermissionCode.FINANCE_REVIEW)).toBe(true);
    expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(false);
  });

  it('gives an auditor read-only access', () => {
    const a = actor({ roles: [RoleCode.AUDITOR] });
    expect(hasPermission(a, PermissionCode.AUDIT_READ)).toBe(true);
    expect(hasPermission(a, PermissionCode.REPORT_READ)).toBe(true);
    expect(hasPermission(a, PermissionCode.EXPENSE_CREATE)).toBe(false);
    expect(hasPermission(a, PermissionCode.CLAIM_SUBMIT)).toBe(false);
  });

  it('unions permissions when a user holds multiple roles (FRD §2)', () => {
    const a = actor({ roles: [RoleCode.EMPLOYEE, RoleCode.FINANCE] });
    expect(hasPermission(a, PermissionCode.EXPENSE_CREATE)).toBe(true);
    expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(true);
  });

  it('denies everything to an inactive employee regardless of role (check 1)', () => {
    const a = actor({ roles: [RoleCode.FINANCE, RoleCode.ADMIN], active: false });
    expect(hasPermission(a, PermissionCode.FINANCE_VERIFY)).toBe(false);
    expect(hasPermission(a, PermissionCode.POLICY_MANAGE)).toBe(false);
    expect(isApprover(a)).toBe(false);
  });

  it('covers every role in the matrix', () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual(Object.values(RoleCode).sort());
  });
});

describe('resource scope (check 3)', () => {
  it('identifies the owner', () => {
    expect(isOwner(actor(), { employeeId: 'EMP-1' })).toBe(true);
    expect(isOwner(actor(), { employeeId: 'EMP-2' })).toBe(false);
  });

  it('accepts a directly assigned approver and a delegated one', () => {
    expect(isAssignedApprover(actor(), { assigneeEmployeeId: 'EMP-1' })).toBe(true);
    expect(
      isAssignedApprover(actor(), {
        assigneeEmployeeId: 'EMP-9',
        delegatedFromEmployeeId: 'EMP-1',
      }),
    ).toBe(true);
    expect(isAssignedApprover(actor(), { assigneeEmployeeId: 'EMP-9' })).toBe(false);
  });

  it('lets an assigned approver read a claim they do not own', () => {
    const approver = actor({ employeeId: 'EMP-2', roles: [RoleCode.REPORTING_MANAGER] });
    const claim = { employeeId: 'EMP-1' };
    expect(canReadClaim(approver, claim, [{ assigneeEmployeeId: 'EMP-2' }])).toBe(true);
    expect(canReadClaim(approver, claim, [])).toBe(false);
  });

  it('lets finance read any claim', () => {
    expect(canReadClaim(actor({ roles: [RoleCode.FINANCE] }), { employeeId: 'EMP-9' })).toBe(true);
  });
});

describe('segregation of duties (check 5, §4)', () => {
  const claim = { employeeId: 'EMP-1' };

  it.each(['approve', 'finance-verify', 'mark-paid'] as const)(
    'blocks a claimant from %s on their own claim',
    (action) => {
      expect(cannotActOnOwnClaim(actor(), claim, action)).toBe(true);
      expect(checkSelfAction(actor(), claim, action)?.action).toBe(action);
    },
  );

  it('allows the same action on someone else\u2019s claim', () => {
    const other = actor({ employeeId: 'EMP-2' });
    expect(cannotActOnOwnClaim(other, claim, 'approve')).toBe(false);
    expect(checkSelfAction(other, claim, 'approve')).toBeNull();
  });

  it('is not bypassed by delegation', () => {
    // EMP-1 holds an approval task delegated to them, but owns the claim.
    const claimant = actor({ roles: [RoleCode.REPORTING_MANAGER] });
    expect(
      isAssignedApprover(claimant, {
        assigneeEmployeeId: 'EMP-9',
        delegatedFromEmployeeId: 'EMP-1',
      }),
    ).toBe(true);
    // Scope says yes; SoD still says no.
    expect(cannotActOnOwnClaim(claimant, claim, 'approve')).toBe(true);
  });
});
