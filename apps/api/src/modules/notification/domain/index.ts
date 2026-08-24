/**
 * Notification domain.
 *
 * In-app notification records and push dispatch. Push is the only channel in scope (GAP-008).
 *
 * PURE: no I/O, no Mongoose, no Express, no Node built-ins. Entities,
 * value objects and invariants only. Enforced by eslint-plugin-boundaries
 * plus the SDK ban in @claimdesk/config-eslint/api-boundaries.
 */
export {};
