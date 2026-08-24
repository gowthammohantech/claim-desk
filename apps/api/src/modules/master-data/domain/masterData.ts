import type { EngagementStatus, PermissionCode, RoleCode } from '@claimdesk/contracts';

/**
 * Backend-maintained master data (design/11 §2, §3) — there is no HR or
 * client-directory integration in scope.
 */

export interface Client {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: string;
  readonly externalId?: string | undefined;
}

export interface Engagement {
  readonly id: string;
  readonly code: string;
  readonly clientId: string;
  readonly name: string;
  readonly status: EngagementStatus;
  readonly startDate?: Date | undefined;
  readonly endDate?: Date | undefined;
  readonly managerEmployeeId?: string | undefined;
  readonly partnerEmployeeId?: string | undefined;
  readonly memberEmployeeIds: readonly string[];
  readonly costCentreId?: string | undefined;
  readonly externalId?: string | undefined;
}

export interface ExpenseCategory {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
  readonly defaultReceiptRequired: boolean;
  readonly accountingDefaults?:
    | { glCode?: string | undefined; taxCode?: string | undefined; costCentreId?: string | undefined }
    | undefined;
}

export interface Role {
  readonly id: string;
  readonly code: RoleCode;
  readonly name: string;
  readonly permissions: readonly PermissionCode[];
  readonly active: boolean;
}

/**
 * design/11 §3: "Only open engagements assigned to the employee are selectable;
 * historical closed engagements remain readable."
 *
 * Selectability and readability are deliberately different predicates — a
 * closed engagement must still render on last year's claim.
 */
export function isSelectable(engagement: Engagement, employeeId: string): boolean {
  return engagement.status === 'OPEN' && engagement.memberEmployeeIds.includes(employeeId);
}
