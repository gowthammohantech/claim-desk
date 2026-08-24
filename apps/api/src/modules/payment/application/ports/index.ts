/**
 * Payment ports — INTERFACES ONLY.
 *
 * The application layer depends on these; `infrastructure/` and
 * `src/integrations/` provide the implementations. This inversion is what
 * keeps the domain free of provider SDKs (TDD §7.1, §16).
 */
export {};
