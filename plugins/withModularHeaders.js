const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Inject `use_modular_headers!` into the iOS Podfile.
 *
 * @react-native-google-signin pulls Swift pods (AppCheckCore →
 * GoogleUtilities, RecaptchaInterop) that don't define module maps, so they
 * can't integrate as static libraries without modular headers. `expo prebuild`
 * regenerates the Podfile from a template and would otherwise drop a manual
 * edit; this plugin re-adds the line on every prebuild so rebuilds stay green.
 */
const ANCHOR = 'use_expo_modules!';
const LINE = '  use_modular_headers!';

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');
      if (!contents.includes('use_modular_headers!')) {
        contents = contents.replace(ANCHOR, `${ANCHOR}\n\n${LINE}`);
        fs.writeFileSync(podfile, contents);
      }
      return cfg;
    },
  ]);
};
