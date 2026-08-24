const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro in a pnpm monorepo.
 *
 * Metro does not follow pnpm's symlinked store, which is why the repo sets
 * `node-linker=hoisted` in .npmrc. These two settings are the other half:
 * without `watchFolders` a change in packages/* never triggers a reload, and
 * without `nodeModulesPaths` the hoisted root packages are invisible.
 *
 * `unstable_enablePackageExports` is required for the `@claimdesk/tokens/native`
 * subpath to resolve at all.
 *
 * Deliberately NOT setting `disableHierarchicalLookup`: expo-doctor flags it,
 * and with `node-linker=hoisted` there is no duplicate-resolution problem for
 * it to solve.
 */
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
