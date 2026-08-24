import type { Employee } from '../../employee/index.js';

/**
 * Employee -> the `Employee` schema in design/06-api-contract.yaml.
 *
 * Explicit rather than spreading the domain object: `paymentProfileMasked` and
 * `externalHrId` are deliberately NOT exposed, and a spread would leak them the
 * moment someone adds a field.
 */
export function toEmployeeDto(employee: Employee): Record<string, unknown> {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    name: employee.name,
    mobileNumber: employee.mobileNumber,
    ...(employee.email ? { email: employee.email } : {}),
    status: employee.status,
    ...(employee.grade ? { grade: employee.grade } : {}),
    ...(employee.department ? { department: employee.department } : {}),
    ...(employee.branch ? { branch: employee.branch } : {}),
    ...(employee.managerEmployeeId ? { managerEmployeeId: employee.managerEmployeeId } : {}),
    roles: [...employee.roles],
  };
}
