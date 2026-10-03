import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const glob = require('fast-glob');

test('build glob discovers dynamic imports with extension braces and nested indexes', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'khonenama-build-glob-'));
  try {
    mkdirSync(join(cwd, 'views', 'nested'), { recursive: true });
    for (const file of ['views/a.js', 'views/b.ts', 'views/c.d.ts', 'views/nested/index.ts', 'views/readme.md']) {
      writeFileSync(join(cwd, file), '');
    }
    const patterns = ['./views/**/*.{js,ts}', '!**/*.d.ts'];
    const expected = ['views/a.js', 'views/b.ts', 'views/nested/index.ts'];
    assert.deepEqual(glob.sync(patterns, { cwd }).sort(), expected);
    assert.deepEqual((await glob(patterns, { cwd })).sort(), expected);
    assert.deepEqual(glob.sync('./views/**/*.{js,ts}', { cwd, ignore: ['**/*.d.ts'] }).sort(), expected);
    assert.throws(() => glob.sync(patterns, { cwd, objectMode: true }), /Unsupported build glob option/);
  } finally {
    // This test owns the exact directory returned by mkdtempSync.
    rmSync(cwd, { recursive: true, force: true });
  }
});
