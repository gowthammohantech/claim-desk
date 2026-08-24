import { writeAuditEvents } from './infrastructure/auditWriter.js';

/**
 * Audit module.
 *
 * Owns the `auditEvents` collection. Its writer is handed to the unit of work
 * at composition time rather than imported by every module — coupling twelve
 * modules to audit at build time would make every fake miserable.
 */
export interface AuditModule {
  writeAuditEvents: typeof writeAuditEvents;
}

export function buildAuditModule(): AuditModule {
  return { writeAuditEvents };
}
