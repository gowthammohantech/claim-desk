/** Roles from design/07-permission-matrix.md §1. A user may hold multiple roles. */
export const RoleCode = {
  EMPLOYEE: 'EMPLOYEE',
  REPORTING_MANAGER: 'REPORTING_MANAGER',
  ENGAGEMENT_MANAGER: 'ENGAGEMENT_MANAGER',
  PARTNER: 'PARTNER',
  FINANCE: 'FINANCE',
  ADMIN: 'ADMIN',
  AUDITOR: 'AUDITOR',
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

export const ROLE_CODES = Object.values(RoleCode) as readonly RoleCode[];
