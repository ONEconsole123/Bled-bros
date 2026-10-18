// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // game/ is plain browser JS concatenated into one HTML file; src/gameHtml.js is generated
    ignores: ['dist/*', 'game/*', 'src/gameHtml.js'],
  },
]);
