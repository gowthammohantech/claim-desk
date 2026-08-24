/**
 * Auth module composition root.
 *
 * Builds the concrete adapters, injects them into the use cases, and exposes
 * the router plus any job handlers the module contributes.
 */
export interface AuthModuleDeps {
  // TODO: inject the logger, config and repositories this module needs.
  _placeholder?: never;
}

export function buildAuthModule(_deps: AuthModuleDeps = {}): Record<string, never> {
  // TODO: return { router, jobHandlers, subscribers }.
  return {};
}
