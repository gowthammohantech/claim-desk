import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Integration tests need a real Mongo replica set and Azurite; they run
    // from vitest.integration.config.ts, not here.
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
  },
});
