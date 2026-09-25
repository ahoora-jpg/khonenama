import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { listPublishedBusinessSitemapEntries } from "@/lib/server/business-sitemap";

const baseUrl = "https://khonenama.ir";
const seoRefreshDate = "2026-09-25";

// Business profiles change independently of code deploys. Generate the sitemap
// at request time so search engines see newly publishable profiles without
// requiring Vinext ISR/KV infrastructure for this low-traffic metadata route.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: seoRefreshDate, changeFrequency: "daily", priority: 1 },
    { url: baseUrl + "/karaj", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.95 },
    { url: baseUrl + "/karaj/curtain", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.94 },
    { url: baseUrl + "/karaj/flooring", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/karaj/carpet", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/karaj/wallpaper", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/karaj/interior-design", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/karaj/smart-home", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/karaj/baraghan", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/category/curtain", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/category/flooring", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/category/carpet", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/wallpaper", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/interior-design", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/smart-home", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.86 },
    { url: baseUrl + "/magazine", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.86 },
    { url: baseUrl + "/tools", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/tools/wallpaper-calculator", lastModified: "2026-09-22", changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/tools/curtain-fabric-calculator", lastModified: "2026-09-22", changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/tools/flooring-estimator", lastModified: seoRefreshDate, changeFrequency: "monthly", priority: 0.86 },
    { url: baseUrl + "/tools/smart-home-scope", lastModified: seoRefreshDate, changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/tools/carpet-estimator", lastModified: "2026-09-22", changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/for-business", lastModified: seoRefreshDate, changeFrequency: "monthly", priority: 0.72 },
    { url: baseUrl + "/for-business/online-discovery-guide", lastModified: seoRefreshDate, changeFrequency: "monthly", priority: 0.74 },
    { url: baseUrl + "/about", lastModified: seoRefreshDate, changeFrequency: "monthly", priority: 0.5 },
    { url: baseUrl + "/editorial-policy", lastModified: seoRefreshDate, changeFrequency: "monthly", priority: 0.48 },
    { url: baseUrl + "/help", changeFrequency: "monthly", priority: 0.45 },
    { url: baseUrl + "/privacy", changeFrequency: "monthly", priority: 0.3 },
    { url: baseUrl + "/terms", changeFrequency: "monthly", priority: 0.3 },
  ];

  const refreshedGuides = new Set([
    "curtain-installation-guide",
    "shade-curtain-guide",
    "smart-curtain-daylight-guide",
  ]);

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: baseUrl + "/magazine/" + guide.slug,
    lastModified: refreshedGuides.has(guide.slug)
      ? seoRefreshDate
      : guide.modifiedAt || guide.publishedAt || "2026-09-19",
    changeFrequency: guide.category === "راهنمای محلی" ? "weekly" : "monthly",
    priority: guide.category === "راهنمای محلی" ? 0.82 : 0.76,
  }));

  const liveBusinesses = await listPublishedBusinessSitemapEntries();
  const businessPages: MetadataRoute.Sitemap = liveBusinesses.map((business) => ({
    url: baseUrl + "/business/" + business.slug,
    lastModified: business.updatedAt || undefined,
    changeFrequency: "weekly",
    priority: business.planCode === "premium" ? 0.86 : 0.78,
  }));

  return [...staticPages, ...guidePages, ...businessPages];
}
