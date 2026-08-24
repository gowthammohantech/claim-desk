/**
 * Background job types (requirements/TDD.md §14).
 *
 * Jobs live in the Mongo `jobs` collection and are leased by the worker via
 * lease/lock fields — deliberately NOT Redis/BullMQ (ADR-004).
 */
export const JobType = {
  OCR_EXTRACT: 'ocr.extract',
  NOTIFICATION_SEND: 'notification.send',
  REPORT_GENERATE: 'report.generate',
  INTEGRATION_EMPLOYEE_SYNC: 'integration.employee-sync',
  INTEGRATION_CLIENT_SYNC: 'integration.client-sync',
  INTEGRATION_ACCOUNTING_EXPORT: 'integration.accounting-export',
  PAYMENT_PROCESS: 'payment.process',
  MAINTENANCE_CLEANUP: 'maintenance.cleanup',
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];

export const JOB_TYPES = Object.values(JobType) as readonly JobType[];
