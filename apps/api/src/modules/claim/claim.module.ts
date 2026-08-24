/**
 * Claim module composition root.
 *
 * Builds the concrete adapters, injects them into the use cases, and exposes
 * the router plus any job handlers the module contributes.
 */
export interface ClaimModuleDeps {
  // TODO: inject the logger, config and repositories this module needs.
  _placeholder?: never;
}

export function buildClaimModule(_deps: ClaimModuleDeps = {}): Record<string, never> {
  // TODO: return { router, jobHandlers, subscribers }.
  return {};
}
