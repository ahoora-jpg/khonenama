const { glob, globSync } = require('tinyglobby');

// The build plugin uses sync(patterns, { cwd }). Keep this adapter scoped:
// unsupported fast-glob options must fail rather than silently change a build.
function optionsForGlob(options = {}) {
  const supported = new Set(['cwd', 'ignore', 'dot', 'absolute', 'onlyFiles', 'onlyDirectories', 'followSymbolicLinks', 'deep']);
  for (const key of Object.keys(options)) {
    if (!supported.has(key)) throw new Error(`Unsupported build glob option: ${key}`);
  }
  return options;
}

function buildGlob(patterns, options) {
  return glob(patterns, optionsForGlob(options));
}
buildGlob.sync = (patterns, options) => globSync(patterns, optionsForGlob(options));
module.exports = buildGlob;
