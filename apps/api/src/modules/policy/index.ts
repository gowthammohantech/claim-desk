/**
 * Policy — public surface.
 *
 * Policy rule evaluation and duplicate scoring. BACKEND ONLY — design/09 §1 forbids shipping firm policy to clients.
 * Owns the `policyDefinitions`, `policyEvaluations` collections.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../policy/application/...` from a sibling is a lint error.
 */
export { type PolicyModuleDeps, buildPolicyModule } from './policy.module.js';
