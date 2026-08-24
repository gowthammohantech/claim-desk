import type { Tx } from '../../../../platform/database/index.js';
import type { Employee } from '../../domain/employee.js';

/**
 * Employee persistence port.
 *
 * Reads take an optional `Tx` — pass it when inside a transaction, or the read
 * comes from outside the transaction's snapshot and can contradict the writes
 * around it. Writes take `Tx` as a REQUIRED argument, so writing outside a
 * transaction is a compile error rather than a review catch.
 */
export interface EmployeeRepository {
  findById(id: string, tx?: Tx): Promise<Employee | null>;
  findByIds(ids: readonly string[], tx?: Tx): Promise<Employee[]>;
  findByMobile(mobileNumber: string, tx?: Tx): Promise<Employee | null>;
  findByCode(employeeCode: string, tx?: Tx): Promise<Employee | null>;
  /** Active holders of a role — resolves NAMED_ROLE workflow stages. */
  findByRole(role: string, tx?: Tx): Promise<Employee[]>;
  list(tx?: Tx): Promise<Employee[]>;
}
