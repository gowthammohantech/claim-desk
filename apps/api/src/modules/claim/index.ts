/**
 * Claim — public surface.
 *
 * Claim assembly, submission and resubmission.
 * Owns the `claims` collection.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../claim/application/...` from a sibling is a lint error.
 */
export { type ClaimModuleDeps, buildClaimModule } from './claim.module.js';
