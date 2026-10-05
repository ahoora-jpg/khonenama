import { NextResponse, type NextRequest } from "next/server";
import { env } from "cloudflare:workers";
import { crossSiteMutation, publicRequestLimit, securityHeaders } from "./request-security";

export async function requestSecurityGate(request: NextRequest) {
  const path = new URL(request.url).pathname;
  const protect = (response: Response) => {
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
    if (path.startsWith("/api/") || /^\/(admin|dashboard)(\/|$)/.test(path)) response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  if (path.startsWith("/api/") && crossSiteMutation(request)) {
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
      if (Number(row?.attempts) > limit) return protect(NextResponse.json({ok:false,error:"TOO_MANY_ATTEMPTS"},{status:429,headers:{"Retry-After":"900"}}));
    } catch {
      return protect(NextResponse.json({ ok: false, error: "SERVICE_UNAVAILABLE" }, { status: 503 }));
    }
  }
  return protect(NextResponse.next());
}


