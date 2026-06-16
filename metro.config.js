// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @sentry/react-native requires `promise/setimmediate/done`, but in RN 0.81
// the `promise` package is nested under react-native/node_modules (not hoisted),
// so Sentry can't resolve it from its own location. Provide a fallback alias.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  promise: path.resolve(__dirname, 'node_modules/react-native/node_modules/promise'),
};

module.exports = config;
