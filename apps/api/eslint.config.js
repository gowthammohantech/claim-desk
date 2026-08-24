import { node } from '@claimdesk/config-eslint/node';
import { apiBoundaries, apiSdkZones } from '@claimdesk/config-eslint/api-boundaries';

export default [
  ...node,
  // Layering rule: Controller -> UseCase -> Domain -> Port <- Adapter.
  apiBoundaries,
  // Infrastructure SDK bans, scoped by path.
  ...apiSdkZones,
  {
    files: ['**/*.test.ts', 'vitest*.config.ts', 'tsup.config.ts', 'eslint.config.js'],
    settings: { 'boundaries/include': [] },
    rules: {
      'boundaries/dependencies': 'off',
      'boundaries/no-unknown-files': 'off',
    },
  },
];
