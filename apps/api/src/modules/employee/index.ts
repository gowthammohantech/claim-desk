export { type EmployeeModule, buildEmployeeModule } from './employee.module.js';
export type { EmployeeRepository } from './application/ports/index.js';
export {
  type Employee,
  EmployeeStatus,
  isActive,
  normalizeEmail,
  normalizeMobile,
} from './domain/index.js';
