const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "."); // adjust if your monorepo root is elsewhere

const config = getDefaultConfig(projectRoot);

// SVG support
const { assetExts, sourceExts } = config.resolver;
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter(ext => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
};

// Monorepo support
config.watchFolders = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "packages"),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;