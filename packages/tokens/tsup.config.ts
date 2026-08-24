import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/native.ts', 'src/semantic.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // build-css.ts writes dist/*.css first (turbo `codegen` runs before `build`),
  // so never wipe dist here.
  clean: false,
  sourcemap: true,
  target: 'es2022',
});
