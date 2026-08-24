// .mjs, not .js: babel.config.js and metro.config.js must stay CommonJS for
// Metro, so this package cannot set "type": "module".
import { reactNative } from '@claimdesk/config-eslint/react-native';

export default [
  { ignores: ['.expo/**', 'dist/**', 'metro.config.js', 'babel.config.js'] },
  ...reactNative,
];
