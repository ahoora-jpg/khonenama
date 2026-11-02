export function crossSiteMutation(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) return false;
  const origin = request.headers.get("origin");
  return request.headers.get("sec-fetch-site") === "cross-site" || Boolean(origin && origin !== new URL(request.url).origin);
}

export function publicRequestLimit(path: string): number | null {
  if (path === "/api/admin/sms/control") return 60;
  if (path.startsWith("/api/admin/")) return 120;
  if (path === "/api/seller-acquisition") return 30;
  if (["/api/billing/checkout", "/api/billing/reconcile"].includes(path)) return 20;
  if (path === "/api/me/business/media/upload") return 120;
  if (path === "/api/search-interest") return 60;
  if (path === "/api/me/business/promotion") return 20;
  if (/^\/api\/business\/[^/]+\/analytics$/.test(path)) return 60;
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

// Report-only rollout: per-response nonce; no script unsafe-inline or unsafe-eval.
export function reportOnlyCsp(nonce: string) {
  if (!/^[a-f0-9]{32}$/.test(nonce)) throw new Error("INVALID_CSP_NONCE");
  return [
    "default-src 'self'",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://ik.imagekit.io",
    "font-src 'self'",
    "connect-src 'self' https://cloudflareinsights.com",
    "media-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:"
  ].join("; ");
}
