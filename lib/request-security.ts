export function crossSiteMutation(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return false;
  const origin = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") === "cross-site" || Boolean(origin && origin !== new URL(request.url).origin);
}

export function publicRequestLimit(path: string): number | null {
  if (["/api/billing/checkout", "/api/billing/reconcile"].includes(path)) return 20;
  if (path === "/api/me/business/media/upload") return 120;
  if (path === "/api/auth/business/login") return 30;
  if (path === "/api/businesses/register") return 10;
  if (["/api/lead/status", "/api/lead/decision", "/api/support/status"].includes(path)) return 30;
  if (["/api/support", "/api/account-deletion"].includes(path)) return 10;
  if (/^\/api\/business\/[^/]+\/(lead|reviews)$/.test(path)) return 20;
  return null;
}

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
  // Enforce the directives that do not require inline-script exceptions.
  "Content-Security-Policy": "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};
