const ROBOTS = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /api
Disallow: /register-business
Disallow: /business/login
Disallow: /business/forgot-password
Disallow: /request-status
Disallow: /business/demo-

Host: https://khonenama.ir
Sitemap: https://khonenama.ir/sitemap.xml
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
