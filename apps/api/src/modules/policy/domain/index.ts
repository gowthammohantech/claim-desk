/**
 * Policy domain.
 *
 * Policy rule evaluation and duplicate scoring. BACKEND ONLY — design/09 §1 forbids shipping firm policy to clients.
 *
 * PURE: no I/O, no Mongoose, no Express, no Node built-ins. Entities,
 * value objects and invariants only. Enforced by eslint-plugin-boundaries
 * plus the SDK ban in @claimdesk/config-eslint/api-boundaries.
 */
export {};
