/**
 * Reporting — public surface.
 *
 * Aggregation reports and exports.
 * Owns no collection of its own.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../reporting/application/...` from a sibling is a lint error.
 */
export { type ReportingModuleDeps, buildReportingModule } from './reporting.module.js';
