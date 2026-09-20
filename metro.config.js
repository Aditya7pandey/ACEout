const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Force `three` to its ESM build.
 *
 * three's exports map is { import: three.module.js, require: three.cjs }.
 * @react-three/fiber ships CJS, so on native it takes the `require` branch and
 * loads three.cjs — whose first statement is a Node-only
 * `process.emitWarning(...)` deprecation notice. React Native's `process` shim
 * has no emitWarning, so it throws "undefined is not a function" during module
 * evaluation and the app dies before it starts. Web never hit this because it
 * resolves the `import` branch.
 *
 * Pointing at the file directly (rather than the package specifier) is
 * deliberate: the exports map does not expose ./build/*, so a specifier would
 * be rejected once package exports are enabled.
 */
const THREE_ESM = path.resolve(__dirname, 'node_modules/three/build/three.module.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: THREE_ESM };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
