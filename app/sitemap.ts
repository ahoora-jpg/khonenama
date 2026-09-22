import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";

const baseUrl = "https://khonenama.ir";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: baseUrl + "/karaj", changeFrequency: "daily", priority: 0.95 },
    { url: baseUrl + "/karaj/curtain", changeFrequency: "daily", priority: 0.94 },
    { url: baseUrl + "/karaj/flooring", changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/karaj/carpet", changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/karaj/wallpaper", changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/karaj/interior-design", changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/karaj/smart-home", changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/karaj/baraghan", changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/category/curtain", changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/category/flooring", changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/category/carpet", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/wallpaper", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/interior-design", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/smart-home", changeFrequency: "weekly", priority: 0.86 },
    { url: baseUrl + "/magazine", changeFrequency: "weekly", priority: 0.86 },
    { url: baseUrl + "/tools", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/tools/wallpaper-calculator", lastModified: "2026-09-22", changeFrequency: "monthly", priority: 0.84 },
    { url: baseUrl + "/for-business", changeFrequency: "monthly", priority: 0.72 },
    { url: baseUrl + "/about", changeFrequency: "monthly", priority: 0.5 },
    { url: baseUrl + "/editorial-policy", changeFrequency: "monthly", priority: 0.48 },
    { url: baseUrl + "/help", changeFrequency: "monthly", priority: 0.45 },
    { url: baseUrl + "/privacy", changeFrequency: "monthly", priority: 0.3 },
    { url: baseUrl + "/terms", changeFrequency: "monthly", priority: 0.3 },
  ];

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: baseUrl + "/magazine/" + guide.slug,
    lastModified: guide.modifiedAt || guide.publishedAt || "2026-09-19",
    changeFrequency: guide.category === "راهنمای محلی" ? "weekly" : "monthly",
    priority: guide.category === "راهنمای محلی" ? 0.82 : 0.76,
  }));

  const liveBusinesses = await listPublishedBusinesses({ limit: 100 });
  const businessPages: MetadataRoute.Sitemap = liveBusinesses.map((business) => ({
    url: baseUrl + "/business/" + business.slug,
    changeFrequency: "weekly",
    priority: business.planCode === "premium" ? 0.86 : 0.78,
  }));

  return [...staticPages, ...guidePages, ...businessPages];
}
