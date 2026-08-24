import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  sourcemap: true,
  clean: true,
  dts: false,
  // Inlining the workspace packages keeps the Docker runtime stage simple:
  // `pnpm install --prod` only has to resolve real npm dependencies, with no
  // `pnpm deploy --legacy` dance under the hoisted node-linker.
  noExternal: [/^@claimdesk\//],
});
