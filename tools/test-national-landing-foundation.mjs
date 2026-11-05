import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function load(path, imports) {
  const exports = {};
  const source = readFileSync(path, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  vm.runInNewContext(outputText, { exports, require: (name) => imports[name] }, { filename: path });
  return exports;
}

const categories = [
  { slug: "curtain", label: "پرده", services: [] },
  { slug: "flooring", label: "کفپوش", services: [] },
  { slug: "carpet", label: "موکت", services: [] },
  { slug: "wallpaper", label: "کاغذ دیواری", services: [] },
  { slug: "interior-design", label: "طراحی داخلی", services: [] },
  { slug: "smart-home", label: "خانه هوشمند", services: [] },
  { slug: "lighting", label: "نورپردازی", services: [] },
];
const discovery = load("lib/national-discovery.ts", { "@/lib/business-taxonomy": {} });

assert.equal(discovery.resolveNationalDiscovery("isfahan", "curtain", categories).city.name, "اصفهان");
assert.equal(discovery.resolveNationalDiscovery("unknown", "curtain", categories), null);
assert.equal(discovery.resolveNationalDiscovery("isfahan", "unknown", categories), null);
assert.equal(discovery.nationalDiscoveryPath("isfahan", "curtain"), "/discover/isfahan/curtain");
assert.ok(discovery.NATIONAL_DISCOVERY_INDEXABLE_ROUTES.length > 0);
assert.ok(discovery.NATIONAL_DISCOVERY_INDEXABLE_ROUTES.every((route) => route.citySlug && route.categorySlug));
assert.ok(discovery.NATIONAL_DISCOVERY_INDEXABLE_ROUTES.every((route) => discovery.resolveNationalDiscovery(route.citySlug, route.categorySlug, categories)));
assert.equal("NATIONAL_DISCOVERY_MINIMUM_BUSINESSES" in discovery, false);
assert.equal(discovery.isIndexableNationalDiscoveryRoute("isfahan", "curtain"), true);
assert.equal(discovery.isIndexableNationalDiscoveryRoute("isfahan", "smart-home"), false);
assert.deepEqual(
  [...discovery.nationalDiscoveryCitiesForCategory("curtain")].map((city) => city.slug),
  ["tehran", "mashhad", "isfahan"],
);

const page = readFileSync("app/discover/[city]/[category]/page.tsx", "utf8");
const category = readFileSync("app/category/[slug]/page.tsx", "utf8");
const sitemap = readFileSync("app/sitemap.ts", "utf8");
const publicBusinesses = readFileSync("lib/server/public-businesses.ts", "utf8");
const styles = readFileSync("app/inner-pages.css", "utf8");
assert.match(page, /exactCity: page\.city\.name/);
assert.match(page, /robots: \{ index: page\.indexable, follow: true \}/);
assert.match(page, /فروشگاه‌ها و متخصصانی را می‌بینید/);
assert.match(page, /راهنماهای مرتبط پیش از انتخاب/);
assert.match(page, /فروشگاه‌ها و متخصصانی را می‌بینید/);
assert.match(category, /nationalDiscoveryCitiesForCategory/);
assert.match(sitemap, /NATIONAL_DISCOVERY_INDEXABLE_ROUTES/);
assert.match(publicBusinesses, /exactCity\?: string/);
assert.match(publicBusinesses, /TRIM\(b\.city\) = \?/);
assert.match(styles, /\.national-discovery-city-links/);

console.log("National landing foundation checks passed.");
