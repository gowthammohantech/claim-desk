import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';

/** Shared flat-config base for every ClaimDesk package. */
export const base = [
  { ignores: ['dist/**', 'build/**', 'coverage/**', '.turbo/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'import-x': importX },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // tsconfig.base.json sets erasableSyntaxOnly, but fail early with a clear message.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message:
            'TS `enum` is banned (erasableSyntaxOnly). Use `as const` objects + a union type so the code survives Hermes, Metro and Node type-stripping.',
        },
      ],
      'import-x/no-cycle': ['error', { maxDepth: 6 }],
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/vitest*.config.ts',
            '**/vitest.setup.ts',
            '**/*.setup.{ts,tsx}',
            '**/tsup.config.ts',
            '**/*.config.{ts,js,mjs}',
            '**/scripts/**',
            'e2e/**',
          ],
        },
      ],
      // Guards against pnpm `node-linker=hoisted` phantom deps and app-to-app coupling.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@claimdesk/*/src/*', '@claimdesk/*/dist/*'],
              message: 'Import the package entry point, not its internals.',
            },
            {
              group: ['**/apps/**'],
              message: 'Apps are leaves. Share code through packages/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];

export default base;
