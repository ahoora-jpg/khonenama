import type { MetadataRoute } from "next";

const baseUrl = "https://khonenama.ir";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/karaj`, changeFrequency: "daily", priority: 0.95 },
    { url: `${baseUrl}/karaj/baraghan`, changeFrequency: "daily", priority: 0.92 },
    { url: `${baseUrl}/category/curtain`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/category/flooring`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/category/carpet`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/category/wallpaper`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/category/interior-design`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/magazine`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/magazine/zebra-curtain-guide`, changeFrequency: "monthly", priority: 0.78 },
    { url: `${baseUrl}/magazine/zebra-vs-shade`, changeFrequency: "monthly", priority: 0.76 },
    { url: `${baseUrl}/magazine/parquet-vs-laminate`, changeFrequency: "monthly", priority: 0.78 },
    { url: `${baseUrl}/magazine/flooring-types-guide`, changeFrequency: "monthly", priority: 0.76 },
    { url: `${baseUrl}/magazine/curtain-buying-guide`, changeFrequency: "monthly", priority: 0.76 },
    { url: `${baseUrl}/magazine/curtain-shops-karaj-guide`, changeFrequency: "weekly", priority: 0.82 },
  ];
}
