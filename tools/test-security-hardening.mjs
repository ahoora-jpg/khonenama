import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports }
  );
  return exports;
}

test("JSON-LD escapes every HTML and JavaScript script-breakout character", () => {
  const { safeJsonLd } = load("lib/safe-json-ld.ts");
  const output = safeJsonLd({ value: "<script>&</script>\u2028\u2029" });
  for (const value of ["<", ">", "&", "\u2028", "\u2029"]) assert.equal(output.includes(value), false);
  for (const escaped of ["\\u003c", "\\u003e", "\\u0026", "\\u2028", "\\u2029"]) assert.equal(output.includes(escaped), true);
});

test("security headers retain enforced baselines and use a non-breaking complete CSP report policy", () => {
  const { securityHeaders } = load("lib/request-security.ts");
  assert.match(securityHeaders["Content-Security-Policy"], /object-src 'none'/);
  assert.match(securityHeaders["Content-Security-Policy-Report-Only"], /default-src 'self'/);
  assert.doesNotMatch(securityHeaders["Content-Security-Policy-Report-Only"], /unsafe-eval|unsafe-inline/);
  assert.equal(securityHeaders["Cross-Origin-Opener-Policy"], "same-origin");
});

test("password strength upgrades and dual-key login limits are present", () => {
  const password = readFileSync("lib/server/password.ts", "utf8");
  const login = readFileSync("app/api/auth/business/login/route.ts", "utf8");
  assert.match(password, /PASSWORD_ITERATIONS = 600_000/);
  assert.match(password, /passwordNeedsRehash/);
  assert.match(login, /business-login:account:/);
  assert.match(login, /Promise\.all\(loginKeys\.map/);
});
