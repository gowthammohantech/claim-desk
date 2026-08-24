// Root config: only lints repo-level tooling files.
// Each app/package owns its own eslint.config.js and is linted via `turbo run lint`.
import { node } from '@claimdesk/config-eslint/node';

export default [
  {
    ignores: [
      'apps/**',
      'packages/**',
      'design/**',
      'requirements/**',
      'reference/**',
      '**/dist/**',
      '**/.turbo/**',
      '**/node_modules/**',
    ],
  },
  ...node,
];
