import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("search stays noindex while links remain crawlable", async () => {
  const text = await source("app/search/page.tsx");
  assert.match(text, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  assert.match(text, /canonical:\s*"\/search"/);
});

test("demo business profiles stay out of the index", async () => {
  const text = await source("app/business/[slug]/page.tsx");
  assert.match(text, /business\.source\s*===\s*"demo"[\s\S]{0,180}index:\s*false/);
});

test("service pages keep the real-inventory indexing threshold", async () => {
  const page = await source("app/services/[category]/[service]/page.tsx");
  const catalog = await source("lib/service-catalog.ts");
  assert.match(catalog, /export const MIN_SERVICE_BUSINESSES\s*=\s*3/);
  assert.match(page, /businesses\.length\s*>=\s*MIN_SERVICE_BUSINESSES/);
  assert.match(page, /ItemList/);
  assert.match(page, /CollectionPage/);
});

test("SEO tools remain discoverable from sitemap and category hub", async () => {
  const sitemap = await source("app/sitemap.ts");
  const category = await source("app/category/[slug]/page.tsx");
  const homeTools = await source("components/HomeTools.tsx");
  assert.match(sitemap, /\/tools\/lighting-estimator/);
  assert.match(category, /lighting:\s*"https:\/\/khonenama\.ir\/tools\/lighting-estimator"/);
  assert.match(homeTools, /\/tools\/lighting-estimator/);
});

test("image sitemap contains only published business media through the public-business query", async () => {
  const text = await source("app/image-sitemap.xml/route.ts");
  assert.match(text, /listPublishedBusinesses\(\{\s*requirePhoto:\s*true,\s*limit:\s*100\s*\}\)/);
  assert.match(text, /force-dynamic/);
  assert.doesNotMatch(text, /\/karaj\/lighting/);
});

test("SEO changes do not collapse canonical host references back to www", async () => {
  for (const path of [
    "app/category/[slug]/page.tsx",
    "app/business/[slug]/page.tsx",
    "app/services/[category]/[service]/page.tsx",
    "app/sitemap.ts",
  ]) {
    const text = await source(path);
    assert.doesNotMatch(text, /https:\/\/www\.khonenama\.ir/i);
  }
});


test("SEO journey analytics stays aggregate and admin-protected", async () => {
  const tracker = await source("components/SeoJourneyTracker.tsx");
  const publicRoute = await source("app/api/seo/events/route.ts");
  const adminRoute = await source("app/api/admin/seo-journey/route.ts");
  const migration = await source("db/migrations/0022_seo_journey.sql");
  assert.match(tracker, /search.*ai.*social.*referral/s);
  assert.match(publicRoute, /seo_journey_daily/);
  assert.match(publicRoute, /crossSiteMutation/);
  assert.doesNotMatch(migration, /\b(ip|user_agent|email|phone|cookie|visitor_id)\b/i);
  assert.match(adminRoute, /isAdminRequest/);
  const authIndex = adminRoute.indexOf("isAdminRequest");
  const dbIndex = adminRoute.indexOf("(env as any).DB");
  assert.ok(authIndex >= 0 && dbIndex > authIndex, "admin auth must precede DB access");
});

test("site layout activates SEO journey tracker without touching SMS infrastructure", async () => {
  const layout = await source("app/layout.tsx");
  assert.match(layout, /SeoJourneyTracker/);
  const security = await source("lib/request-security.ts");
  assert.match(security, /\/api\/seo\/events/);
});
