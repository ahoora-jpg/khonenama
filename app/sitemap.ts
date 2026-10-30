import { listServiceSitemapEntries } from "@/lib/server/service-sitemap";
import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { listPublishedBusinessSitemapEntries } from "@/lib/server/business-sitemap";

const baseUrl = "https://khonenama.ir";
const seoRefreshDate = "2026-09-25";
const homepageBrandRefreshDate = "2026-10-18";
const aboutBrandRefreshDate = "2026-10-16";
const categoryRefreshDate = "2026-10-15";
// Fixed date of published content/link changes, never the sitemap request date.
const sixDomainSeoRefreshDate = "2026-10-04";
// Published PRs 36–39 changed guide discovery, the homepage and acquisition copy.
// Keep this tied to the content publication date, not the current request date.
const discoveryAndAcquisitionRefreshDate = "2026-10-18";
const seoOpportunityBatchDate = "2026-10-31";

// Business profiles change independently of code deploys. Generate the sitemap
// at request time so search engines see newly publishable profiles without
// requiring Vinext ISR/KV infrastructure for this low-traffic metadata route.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: homepageBrandRefreshDate, changeFrequency: "daily", priority: 1 },
    { url: baseUrl + "/karaj", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.95 },
    { url: baseUrl + "/karaj/curtain", lastModified: sixDomainSeoRefreshDate, changeFrequency: "daily", priority: 0.94 },
    { url: baseUrl + "/karaj/curtain/markets", lastModified: "2026-09-29", changeFrequency: "weekly", priority: 0.93 },
    { url: baseUrl + "/karaj/flooring", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/karaj/carpet", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/karaj/wallpaper", lastModified: seoOpportunityBatchDate, changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/karaj/interior-design", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/karaj/smart-home", lastModified: seoRefreshDate, changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/karaj/baraghan", lastModified: seoRefreshDate, changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/category/lighting", lastModified: categoryRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/curtain", lastModified: discoveryAndAcquisitionRefreshDate, changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/category/flooring", lastModified: "2026-10-16", changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/category/carpet", lastModified: categoryRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/wallpaper", lastModified: categoryRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/interior-design", lastModified: "2026-10-16", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/smart-home", lastModified: categoryRefreshDate, changeFrequency: "weekly", priority: 0.86 },
    { url: baseUrl + "/magazine", lastModified: discoveryAndAcquisitionRefreshDate, changeFrequency: "weekly", priority: 0.86 },
    { url: baseUrl + "/tools", lastModified: discoveryAndAcquisitionRefreshDate, changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/tools/wallpaper-calculator", lastModified: seoOpportunityBatchDate, changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/tools/curtain-fabric-calculator", lastModified: "2026-10-15", changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/tools/flooring-estimator", lastModified: "2026-10-15", changeFrequency: "monthly", priority: 0.86 },
    { url: baseUrl + "/tools/smart-home-scope", lastModified: seoOpportunityBatchDate, changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/tools/carpet-estimator", lastModified: seoOpportunityBatchDate, changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/for-business", lastModified: "2026-10-17", changeFrequency: "monthly", priority: 0.72 },
    { url: baseUrl + "/download-app", lastModified: "2026-10-04", changeFrequency: "monthly", priority: 0.64 },
    { url: baseUrl + "/for-business/online-discovery-guide", lastModified: discoveryAndAcquisitionRefreshDate, changeFrequency: "monthly", priority: 0.74 },
    { url: baseUrl + "/about", lastModified: aboutBrandRefreshDate, changeFrequency: "monthly", priority: 0.5 },
    { url: baseUrl + "/help", lastModified: "2026-10-05", changeFrequency: "monthly", priority: 0.45 },
    { url: baseUrl + "/privacy", changeFrequency: "monthly", priority: 0.3 },
    { url: baseUrl + "/account-deletion", lastModified: "2026-09-28", changeFrequency: "monthly", priority: 0.3 },
    { url: baseUrl + "/terms", changeFrequency: "monthly", priority: 0.3 },
  ];

  const seoOpportunityGuides = new Set([
    "punch-curtain-guide",
    "wallpaper-guide",
    "wall-mural-guide",
    "thermowall-guide",
    "water-leak-sensor-guide",
    "roman-curtain-guide",
    "zebra-vs-roman-shade",
    "carpet-bedroom-guide",
    "carpet-types-guide",
    "zebra-curtain-guide",
    "shade-curtain-guide",
    "curtain-installation-guide",
    "smart-home-without-internet-guide",
  ]);

  const refreshedGuides = new Set([
    "curtain-installation-guide",
    "shade-curtain-guide",
    "smart-curtain-daylight-guide",
    "zebra-curtain-guide",
    "smart-home-without-internet-guide",
  ]);

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: baseUrl + "/magazine/" + guide.slug,
    lastModified: seoOpportunityGuides.has(guide.slug)
      ? seoOpportunityBatchDate
      : guide.relatedCategory
        ? [sixDomainSeoRefreshDate, guide.modifiedAt || guide.publishedAt || "2026-09-19"].sort().at(-1)
        : refreshedGuides.has(guide.slug)
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

  return [...staticPages, ...guidePages, ...businessPages, ...await listServiceSitemapEntries()];
}

