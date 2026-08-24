import type { EmployeeRepository } from './application/ports/employeeRepository.js';
import { createMongoEmployeeRepository } from './infrastructure/mongoEmployeeRepository.js';

/**
 * Employee module. Owns `employees` and `roles`.
 *
 * Master data is maintained manually from the backend — there is no HR
 * integration in scope (design/11 §2).
 */
export interface EmployeeModule {
  employees: EmployeeRepository;
}

export function buildEmployeeModule(): EmployeeModule {
  return { employees: createMongoEmployeeRepository() };
}
