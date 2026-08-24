/**
 * Approval module composition root.
 *
 * Builds the concrete adapters, injects them into the use cases, and exposes
 * the router plus any job handlers the module contributes.
 */
export interface ApprovalModuleDeps {
  // TODO: inject the logger, config and repositories this module needs.
  _placeholder?: never;
}

export function buildApprovalModule(_deps: ApprovalModuleDeps = {}): Record<string, never> {
  // TODO: return { router, jobHandlers, subscribers }.
  return {};
}
