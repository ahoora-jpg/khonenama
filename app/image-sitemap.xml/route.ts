import { guides } from "@/lib/guides";
import { editorialVisuals, getCategoryVisual, getGuideVisual } from "@/lib/visuals";

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

export const dynamic = "force-static";

export function GET() {
  const categorySlugs = ["curtain", "flooring", "carpet", "wallpaper", "interior-design", "smart-home"];

  const categoryEntries = categorySlugs.map((slug) => {
    const visual = getCategoryVisual(slug);
    return imageEntry(`${baseUrl}/category/${slug}`, visual.src, visual.alt);
  });

  const guideEntries = guides.map((guide) => {
    // Keep the sitemap aligned with the image rendered by the current guide template.
    const visual = getGuideVisual(guide.category);
    return imageEntry(`${baseUrl}/magazine/${guide.slug}`, visual.src, visual.alt);
  });

  const homepageEntries = Object.values(editorialVisuals).map((visual) =>
    imageEntry(baseUrl, visual.src, visual.alt),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${[
    ...homepageEntries,
    ...categoryEntries,
    ...guideEntries,
  ].join("\n")}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
