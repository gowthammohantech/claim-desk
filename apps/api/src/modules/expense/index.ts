/**
 * Expense — public surface.
 *
 * Expense capture, editing and duplicate resolution.
 * Owns the `expenses`, `duplicateCases` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../expense/application/...` from a sibling is a lint error.
 */
export { type ExpenseModuleDeps, buildExpenseModule } from './expense.module.js';
