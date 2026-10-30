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

test("image sitemap uses the scalable published-media query and keeps local routes real", async () => {
  const route = await source("app/image-sitemap.xml/route.ts");
  const lookup = await source("lib/server/business-image-sitemap.ts");
  assert.match(route, /listPublishedBusinessImageSitemapEntries/);
  assert.match(route, /force-dynamic/);
  assert.doesNotMatch(route, /\/karaj\/lighting/);
  assert.match(lookup, /b\.status='published'/);
  assert.match(lookup, /owner_paused=1/);
  assert.match(lookup, /gallery_rank<=10/);
  assert.match(lookup, /MAX_BUSINESSES = 5000/);
  assert.doesNotMatch(lookup, /media_type[^\n]*video[^\n]*SELECT/i);
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


test("seismic-wallpaper guide remains evidence based and avoids decorative-product safety claims", async () => {
  const guide = await source("lib/guide-seismic-wallpaper.ts");
  assert.match(guide, /kit\.edu\/kit\/pi_2010_897\.php/);
  assert.match(guide, /publikationen\.bibliothek\.kit\.edu\/1000148218/);
  assert.match(guide, /جای مقاوم‌سازی سازه‌ای را نمی‌گیرد|جای ارزیابی سازه و مقاوم‌سازی مهندسی/);
  assert.match(guide, /کاغذ دیواری تزئینی معمولی/);
});

test("initial hero image remains prioritized for LCP", async () => {
  const hero = await source("components/HeroCoverflow.tsx");
  assert.match(hero, /loading=\{index === 0 \? "eager" : "lazy"\}/);
  assert.match(hero, /fetchPriority=\{index === 0 \? "high" : "low"\}/);
});


test("content principles stay discoverable and machine linked", async () => {
  const page = await source("app/content-principles/page.tsx");
  const home = await source("app/page.tsx");
  const guide = await source("app/magazine/[slug]/page.tsx");
  const footer = await source("components/Footer.tsx");
  const sitemap = await source("app/sitemap.ts");
  assert.match(page, /اصول تحریریه و صحت اطلاعات خونه‌نما/);
  assert.match(home, /publishingPrinciples:\s*"https:\/\/khonenama\.ir\/content-principles"/);
  assert.match(guide, /publishingPrinciples:\s*"https:\/\/khonenama\.ir\/content-principles"/);
  assert.match(footer, /\/content-principles/);
  assert.match(sitemap, /\/content-principles/);
});


test("robots keeps public discovery open while private APIs stay blocked", async () => {
  const robots = await source("app/robots.txt/route.ts");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Disallow: \/api/);
  assert.match(robots, /Sitemap: https:\/\/khonenama\.ir\/sitemap\.xml/);
  assert.match(robots, /Sitemap: https:\/\/khonenama\.ir\/image-sitemap\.xml/);
});
