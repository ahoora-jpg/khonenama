import { securityAudit } from "./security-audit";
import { securityHeaders } from "../request-security";

// Early service-binding, bridge and redirect returns bypass application middleware.
// Apply transport / response controls without changing their contracts or bodies.
export async function secureWorkerResponse(request: Request, handler: () => Promise<Response>) {
  const url = new URL(request.url);
  if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    url.protocol = "https:";
    return Response.redirect(url.href, 308);
  }
  const original = await handler();
  if (url.pathname.startsWith("/api/admin/") && !["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    securityAudit(url.pathname.endsWith("/login") ? "login" : "admin_mutation", original.status < 400 ? "allowed" : original.status >= 500 ? "unavailable" : "denied", original.status);
  }
  const outcome = original.status < 400 ? "allowed" : original.status >= 500 ? "unavailable" : "denied";
  if (url.pathname === "/api/auth/business/login") securityAudit("login", outcome, original.status);
  else if (url.pathname === "/api/auth/business/recovery") securityAudit("password_recovery", outcome, original.status);
  else if (url.pathname === "/api/me/business/media/upload" && original.status >= 400) securityAudit("upload_reject", outcome, original.status);
  else if (url.pathname === "/api/billing/reconcile" && original.status >= 400) securityAudit("payment_verification", outcome, original.status);
  else if (url.pathname.endsWith("/security-readiness") && original.status === 503) securityAudit("secret_configuration", "unavailable", 503);
  else if (url.pathname.startsWith("/api/") && [401,403].includes(original.status)) securityAudit("permission_denied", "denied", original.status);
  const response = new Response(original.body, original);
  for (const [name, value] of Object.entries(securityHeaders)) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  if (/^\/(api|admin|dashboard|sms)(\/|$)/.test(url.pathname)) response.headers.set("Cache-Control", "private, no-store");
  if (/^\/(api\/admin|admin|sms)(\/|$)/.test(url.pathname)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
