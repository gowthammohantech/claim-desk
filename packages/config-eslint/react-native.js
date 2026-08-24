import reactHooks from 'eslint-plugin-react-hooks';
import { base } from './base.js';

export const reactNative = [
  ...base,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: { __DEV__: 'readonly', console: 'readonly', fetch: 'readonly' },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      /*
       * React Native ships Flow-typed source (`react-native/index.js`), which
       * the TypeScript parser cannot read. `no-cycle` walks into it and floods
       * the output with parse warnings for a check that cannot work here.
       * Cycles are still caught in the shared packages and in apps/api.
       */
      'import-x/no-cycle': 'off',
    },
  },
];

export default reactNative;
