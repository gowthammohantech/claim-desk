module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    // babel-preset-expo already includes the expo-router plugin and
    // reads tsconfig `paths`, so no babel-plugin-module-resolver is needed.
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
