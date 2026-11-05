import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("app/search/page.tsx", "utf8");

test("empty search results offer existing category guides without implying a live booth", () => {
  assert.match(source, /matchingCategories\.length > 0/);
  assert.match(source, /href=\{["']\/category\/["'] \+ category\.slug\}/);
  assert.match(source, /نمایش این راهنما به معنی وجود فروشنده در نتایج فعلی نیست/);
});

test("lighting searches can discover the existing lighting category guide", () => {
  assert.match(source, /lighting: \["نورپردازی", "روشنایی", "چراغ خطی", "چراغ ریلی", "چراغ مگنتی"\]/);
  assert.match(source, /query\.length >= 2/);
});
