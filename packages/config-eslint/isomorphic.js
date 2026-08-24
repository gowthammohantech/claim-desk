/**
 * Guard for @claimdesk/contracts and @claimdesk/domain.
 *
 * These packages run in Node (api), the browser (web) AND Hermes (mobile).
 * Any platform import breaks one of the three, so ban them all.
 *
 * Also enforces the shared-package dependency direction:
 *   contracts -> domain -> api-client        (no cycles, no back-edges)
 */
export const isomorphic = [
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'mongoose',
                'mongodb',
                'express',
                'react',
                'react-dom',
                'react-native',
                '@azure/*',
                'node:*',
                'fs',
                'path',
                'crypto',
                'os',
              ],
              message:
                'This package is isomorphic (Node + browser + Hermes). No platform-specific imports.',
            },
            {
              group: ['@claimdesk/api-client', '@claimdesk/tokens'],
              message:
                'Shared-package dependency direction is contracts -> domain -> api-client. No back-edges.',
            },
          ],
        },
      ],
    },
  },
];

export default isomorphic;
