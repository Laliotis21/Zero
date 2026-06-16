// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Node-only build tooling (not part of the RN bundle).
    ignores: ["dist/*", "scripts/*", "node_modules/*"],
  }
]);
