import type { MetadataRoute } from "next";
import { guides } from "@/lib/guides";

const baseUrl = "https://khonenama.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: baseUrl + "/karaj", changeFrequency: "daily", priority: 0.95 },
    { url: baseUrl + "/karaj/curtain", changeFrequency: "daily", priority: 0.94 },
    { url: baseUrl + "/karaj/flooring", changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/karaj/baraghan", changeFrequency: "daily", priority: 0.92 },
    { url: baseUrl + "/category/curtain", changeFrequency: "weekly", priority: 0.9 },
    { url: baseUrl + "/category/flooring", changeFrequency: "weekly", priority: 0.88 },
    { url: baseUrl + "/category/carpet", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/wallpaper", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/category/interior-design", changeFrequency: "weekly", priority: 0.8 },
    { url: baseUrl + "/magazine", changeFrequency: "weekly", priority: 0.86 },
  ];

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: baseUrl + "/magazine/" + guide.slug,
    changeFrequency: guide.category === "راهنمای محلی" ? "weekly" : "monthly",
    priority: guide.category === "راهنمای محلی" ? 0.82 : 0.76,
  }));

  return [...staticPages, ...guidePages];
}
