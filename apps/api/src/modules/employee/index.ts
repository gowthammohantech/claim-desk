/**
 * Employee — public surface.
 *
 * Employee directory, roles and profile.
 * Owns the `employees`, `roles` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../employee/application/...` from a sibling is a lint error.
 */
export { type EmployeeModuleDeps, buildEmployeeModule } from './employee.module.js';
