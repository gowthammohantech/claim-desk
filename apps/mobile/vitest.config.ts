import { defineConfig } from 'vitest/config';

/**
 * Unit tests for plain TypeScript in `src/lib` and `src/theme`.
 *
 * Component and journey coverage for mobile is device-level — camera and
 * gallery permissions, interrupted uploads, low connectivity,
 * background/foreground, deep links, safe-area and accessibility
 * (design/13-test-strategy.md §7) — and belongs in the E2E suite, not here.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
