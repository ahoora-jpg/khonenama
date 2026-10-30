import { guides } from "@/lib/guides";
import { getCategoryVisual, getGuideVisual, getLocalVisual } from "@/lib/visuals";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";

const baseUrl = "https://khonenama.ir";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function imageEntry(pageUrl: string, imageUrl: string, caption: string) {
  return `  <url>\n    <loc>${escapeXml(pageUrl)}</loc>\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n      <image:caption>${escapeXml(caption)}</image:caption>\n    </image:image>\n  </url>`;
}

function multiImageEntry(pageUrl: string, images: { url: string; caption: string }[]) {
  const imageXml = images
    .filter((image) => image.url.startsWith("https://"))
    .slice(0, 8)
    .map((image) => `    <image:image>\n      <image:loc>${escapeXml(image.url)}</image:loc>\n      <image:caption>${escapeXml(image.caption)}</image:caption>\n    </image:image>`)
    .join("\n");
  return imageXml ? `  <url>\n    <loc>${escapeXml(pageUrl)}</loc>\n${imageXml}\n  </url>` : "";
}

export const dynamic = "force-dynamic";

export async function GET() {
  const categorySlugs = ["lighting", "curtain", "flooring", "carpet", "wallpaper", "interior-design", "smart-home"];
  const localSlugs = ["curtain", "flooring", "carpet", "wallpaper", "interior-design", "smart-home"];

  const homeEntry = imageEntry(
    `${baseUrl}/`,
    `${baseUrl}/images/editorial/photo-1602612996819-3cd306f68b4e.webp`,
    "کرکره پنجره و نور طبیعی در فضای داخلی"
  );

  const categoryEntries = categorySlugs.map((slug) => {
    const visual = getCategoryVisual(slug);
    return imageEntry(`${baseUrl}/category/${slug}`, visual.src, visual.alt);
  });

  const localEntries = localSlugs.map((slug) => {
    const visual = getLocalVisual(slug);
    return imageEntry(`${baseUrl}/karaj/${slug}`, visual.src, visual.alt);
  });

  const guideEntries = guides.map((guide) => {
    const visual = getGuideVisual(guide.category, guide.slug);
    return imageEntry(`${baseUrl}/magazine/${guide.slug}`, visual.src, visual.alt);
  });

  const businesses = await listPublishedBusinesses({ requirePhoto: true, limit: 100 });
  const businessEntries = businesses
    .map((business) =>
      multiImageEntry(
        `${baseUrl}/business/${business.slug}`,
        business.media
          .filter((media) => media.kind !== "video" && Boolean(media.url))
          .map((media) => ({
            url: media.url,
            caption: media.altText || `${business.name}؛ نمونه‌کار یا تصویر کسب‌وکار در ${business.city}${business.area ? "، " + business.area : ""}`,
          }))
      )
    )
    .filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[
    homeEntry,
    ...categoryEntries,
    ...localEntries,
    ...guideEntries,
    ...businessEntries,
  ].join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
