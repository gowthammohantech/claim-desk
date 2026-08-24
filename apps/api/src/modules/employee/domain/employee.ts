import type { RoleCode } from '@claimdesk/contracts';

/**
 * Employee — the identity every other aggregate hangs off.
 *
 * Plain interface with `string` ids and no Mongoose anywhere: `domain/` is
 * lint-banned from persistence, and keeping ObjectIds out of the domain is what
 * stops them leaking into JSON responses.
 */
export const EmployeeStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

export interface Employee {
  readonly id: string;
  readonly employeeCode: string;
  readonly name: string;
  readonly mobileNumber: string;
  readonly email?: string | undefined;
  readonly status: EmployeeStatus;
  readonly grade?: string | undefined;
  readonly department?: string | undefined;
  readonly branch?: string | undefined;
  readonly managerEmployeeId?: string | undefined;
  readonly paymentProfileMasked?: string | undefined;
  readonly externalHrId?: string | undefined;
  readonly roles: readonly RoleCode[];
}

export const isActive = (employee: Employee): boolean =>
  employee.status === EmployeeStatus.ACTIVE;

/**
 * Normalizes an email for the unique index.
 *
 * design/04 §4 asks for "unique normalized email". Storing the normalized form
 * in its own field beats a collation index: it is obvious in a document dump,
 * and it is testable without collation subtleties.
 */
export const normalizeEmail = (email: string | undefined): string | undefined => {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
};

/**
 * Normalizes a mobile number to its 10-digit national form.
 *
 * `+919876543210` and `9876543210` are the same person, and design/11 §2
 * requires a mobile number to map to exactly one active employee — so they must
 * collapse to one value before the unique index sees them.
 */
export const normalizeMobile = (mobileNumber: string): string =>
  mobileNumber.trim().replace(/^\+91/, '');
