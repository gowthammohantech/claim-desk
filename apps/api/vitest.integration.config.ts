import { defineConfig } from 'vitest/config';

/**
 * Integration tests run against a REAL MongoDB replica set and an Azurite blob
 * emulator (design/13-test-strategy.md §2). A standalone mongod cannot be used:
 * claim submission commits the claim transition and the first approval task in
 * one transaction, and Mongo transactions require a replica set.
 *
 * Bring the dependencies up with `pnpm infra:up` first.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
