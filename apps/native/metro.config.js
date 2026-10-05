// Learn more https://docs.expo.dev/guides/monorepos/
// Expo SDK 52+ detects the monorepo automatically (watchFolders, nodeModulesPaths).
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
