import { JOB_TYPES, type JobType } from '@claimdesk/contracts';

import type { JobHandler, JobRegistry } from '../jobs/index.js';
import type { AppLogger } from '../platform/observability/logger.js';

/**
 * Job type -> handler.
 *
 * Every type in the contract gets an entry so an unhandled job is impossible.
 * Types with no implementation yet map to a handler that dead-letters loudly
 * rather than silently succeeding — a job that "passes" without doing anything
 * is far worse than one that visibly fails.
 */
export function buildJobRegistry(logger: AppLogger): JobRegistry {
  const notImplemented =
    (type: JobType): JobHandler =>
    async () => {
      logger.error({ jobType: type }, 'job.handler_missing');
      throw new Error(`No handler registered for job type "${type}".`);
    };

  const registry: JobRegistry = new Map();
  for (const type of JOB_TYPES) {
    registry.set(type, notImplemented(type));
  }

  // TODO(handlers): replace as each module lands.
  //   ocr.extract                    -> modules/receipt
  //   notification.send              -> modules/notification
  //   report.generate                -> modules/reporting
  //   integration.employee-sync      -> integrations/hr
  //   integration.client-sync        -> integrations/client-engagement
  //   integration.accounting-export  -> integrations/accounting
  //   payment.process                -> modules/payment
  //   maintenance.cleanup            -> platform

  return registry;
}
