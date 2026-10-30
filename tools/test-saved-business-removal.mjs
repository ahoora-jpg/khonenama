import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");
const read = (file) => readFileSync(resolve(root, file), "utf8");

test("public saved-business feature is fully removed", () => {
  for (const file of [
    "components/SavedBusinessButton.tsx",
    "components/SavedBusinesses.tsx",
    "app/saved/page.tsx",
  ]) {
    assert.equal(existsSync(resolve(root, file)), false, `${file} must be removed`);
  }

  const publicSources = [
    "app/business/[slug]/page.tsx",
    "components/Footer.tsx",
    "app/help/page.tsx",
    "app/about/page.tsx",
  ].map(read).join("\n");

  assert.doesNotMatch(publicSources, /SavedBusiness|\/saved|غرفه‌های ذخیره‌شده|ذخیره غرفه/);
});

test("mobile business header reserves a full row for the booth name", () => {
  const styles = read("app/inner-pages.css");
  assert.match(styles, /\.business-profile-page \.profile-name-line h1 \{ flex: 1 1 100%/);
  assert.match(styles, /word-break: normal/);
  assert.match(styles, /\.business-profile-page \.profile-actions \{ display: grid/);
});
