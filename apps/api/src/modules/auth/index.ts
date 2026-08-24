/**
 * Auth — public surface.
 *
 * Mobile number + OTP sign-in, token issue and refresh (ADR-007).
 * Owns no collection of its own.
 *
 * This file is the ONLY thing another module may import. Reaching into
 * `../auth/application/...` from a sibling is a lint error.
 */
export { type AuthModuleDeps, buildAuthModule } from './auth.module.js';
