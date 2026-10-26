const SMS_HOST = "sms.khonenama.ir";
const allowedPaths = new Set([
  "/sms", "/sms/login", "/api/admin/login", "/api/admin/logout",
  "/favicon.ico", "/site.webmanifest",
]);
const allowedPrefixes = ["/api/admin/sms/", "/_next/", "/assets/", "/fonts/"];

/** Keep the SMS subdomain scoped to its own interface and authentication endpoints. */
export function routeSmsHost(request: Request): Request | Response {
  const url = new URL(request.url);
  if (url.hostname.toLowerCase() !== SMS_HOST) return request;
  if (url.pathname === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
  if (url.pathname === "/") url.pathname = "/sms";
  else if (url.pathname === "/login") url.pathname = "/sms/login";
  if (!allowedPaths.has(url.pathname) && url.pathname !== "/api/admin/sms" &&
      !allowedPrefixes.some(prefix => url.pathname.startsWith(prefix))) {
    return new Response("یافت نشد", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  }
  return url.href === request.url ? request : new Request(url, request);
}
