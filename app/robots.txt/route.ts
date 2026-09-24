const ROBOTS = `User-agent: *
Allow: /
Disallow: /api
Disallow: /business/demo-

Host: https://khonenama.ir
Sitemap: https://khonenama.ir/sitemap.xml
Sitemap: https://khonenama.ir/image-sitemap.xml
`;

export const dynamic = "force-static";

export function GET() {
  return new Response(ROBOTS, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
