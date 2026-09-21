import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/api",
          "/register-business",
          "/business/login",
          "/business/forgot-password",
          "/request-status",
          "/business/demo-",
        ],
      },
    ],
    sitemap: "https://khonenama.ir/sitemap.xml",
    host: "https://khonenama.ir",
  };
}
