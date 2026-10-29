import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const ignored = new Set(["node_modules", ".next", ".git"]);

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx|js|mjs|md|txt)$/.test(entry.name) ? [path] : [];
  });
}

test("the retired editorial-policy page has no remaining public links", () => {
  assert.equal(existsSync(join(root, "app", "editorial-policy", "page.tsx")), false);
  const references = sourceFiles(root)
    .filter((path) => !path.endsWith("test-editorial-policy-removal.mjs"))
    .filter((path) => readFileSync(path, "utf8").includes("editorial-policy"));
  assert.deepEqual(references, []);
});
