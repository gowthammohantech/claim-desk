/**
 * Audit — public surface.
 *
 * Append-only audit event log and the audit explorer.
 * Owns the `auditEvents` collection.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../audit/application/...` from a sibling is a lint error.
 */
export { type AuditModuleDeps, buildAuditModule } from './audit.module.js';
