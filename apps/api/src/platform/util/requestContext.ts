import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request context, carried without threading it through every signature.
 *
 * `correlationId` is honoured from the inbound `x-correlation-id` header when
 * present so a single id spans mobile -> API -> worker -> integration, which is
 * what makes the audit trail and the logs joinable.
 */
export interface RequestContext {
  requestId: string;
  correlationId: string;
  employeeId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return storage.run(context, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Attaches the authenticated actor once authentication has run. */
export function setContextEmployee(employeeId: string): void {
  const context = storage.getStore();
  if (context) context.employeeId = employeeId;
}
