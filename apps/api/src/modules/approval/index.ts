/**
 * Approval — public surface.
 *
 * Approval workflow resolution, task assignment and decisions.
 * Owns the `approvalTasks`, `workflowDefinitions`, `delegations` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../approval/application/...` from a sibling is a lint error.
 */
export { type ApprovalModuleDeps, buildApprovalModule } from './approval.module.js';
