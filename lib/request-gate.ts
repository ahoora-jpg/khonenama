import { isAdminRequest } from "./server/admin-session";
import { securityAudit } from "./server/security-audit";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "cloudflare:workers";
import { crossSiteMutation, publicRequestLimit, securityHeaders, reportOnlyCsp } from "./request-security";

export async function requestSecurityGate(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const nonce = crypto.randomUUID().replaceAll("-", "");
  const candidateCsp = reportOnlyCsp(nonce);
  const protect = (response: Response) => {
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    response.headers.set("Content-Security-Policy-Report-Only", candidateCsp);
    if (path.startsWith("/api/") || /^\/(admin|dashboard|sms)(\/|$)/.test(path)) response.headers.set("Cache-Control", "private, no-store");
    if (/^\/(api\/admin|admin|sms)(\/|$)/.test(path)) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  };
  const privateAdminPage = /^\/admin(\/|$)/.test(path) && path !== "/admin/login";
  const privateSmsPage = /^\/sms(\/|$)/.test(path) && path !== "/sms/login";
  if ((privateAdminPage || privateSmsPage) && !await isAdminRequest(request)) {
    const loginPath = privateAdminPage ? "/admin/login" : new URL(request.url).hostname === "sms.khonenama.ir" ? "/login" : "/sms/login";
    return protect(new Response(null, { status: 307, headers: { Location: new URL(loginPath, request.url).href } }));
  }
  if (path.startsWith("/api/") && crossSiteMutation(request)) {
    securityAudit("csrf_reject", "denied", 403);
    return protect(NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 }));
  }
  if (path.startsWith("/api/") && !["GET", "HEAD", "OPTIONS"].includes(request.method) && request.headers.get("content-type")?.includes("application/json")) {
    if (Number(request.headers.get("content-length") || 0) > 65536) {
      return protect(NextResponse.json({ok:false,error:"REQUEST_TOO_LARGE"},{status:413}));
    }
    const reader = request.clone().body?.getReader();
    let bytes = 0;
    if (reader) {
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          bytes += chunk.value.byteLength;
          if (bytes > 65536) {
            reader.releaseLock();
            return protect(NextResponse.json({ok:false,error:"REQUEST_TOO_LARGE"},{status:413}));
          }
        }
      } catch {
        return protect(NextResponse.json({ok:false,error:"INVALID_REQUEST"},{status:400}));
      }
    }
  }
  const limit = request.method === "POST" ? publicRequestLimit(path) : null;
  if (limit !== null) {
    try {
      const db = (env as any).DB;
      if (!db) throw new Error("UNAVAILABLE");
      const ip = request.headers.get("cf-connecting-ip") || "unknown";
      // Group all business slugs together so changing a slug cannot evade the limit.
      const group = path.replace(/\/business\/[^/]+\//, "/business/*/");
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(group + ":" + ip));
      const key = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      await db.prepare("CREATE TABLE IF NOT EXISTS public_request_limits (key_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_started TEXT NOT NULL)").run();
      const row = await db.prepare("INSERT INTO public_request_limits (key_hash, attempts, window_started) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN julianday(window_started)<=julianday('now','-15 minutes') THEN 1 ELSE attempts+1 END, window_started=CASE WHEN julianday(window_started)<=julianday('now','-15 minutes') THEN CURRENT_TIMESTAMP ELSE window_started END RETURNING attempts").bind(key).first();
      if (Number(row?.attempts) > limit) { securityAudit("rate_limit", "denied", 429); return protect(NextResponse.json({ok:false,error:"TOO_MANY_ATTEMPTS"},{status:429,headers:{"Retry-After":"900"}})); }
    } catch {
      return protect(NextResponse.json({ ok: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 }));
    }
  }
  // Overwrite untrusted incoming values. The renderer extracts this nonce from
  // the internal request CSP; the browser receives only the report-only policy.
  const headers = new Headers(request.headers);
  headers.set("content-security-policy", candidateCsp);
  headers.set("x-csp-nonce", nonce);
  return protect(NextResponse.next({ request: { headers } }));
}


