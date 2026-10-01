import { env } from "cloudflare:workers";

export async function allowAdminLogin(request: Request) {
  const db = (env as any).DB;
  if (!db) return false;
  // Cloudflare overwrites this header; do not accept a caller's forwarded IP.
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("admin-login:" + ip));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  await db.prepare("CREATE TABLE IF NOT EXISTS admin_login_rate_limits (key_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_started TEXT NOT NULL)").run();
  const row = await db.prepare("INSERT INTO admin_login_rate_limits (key_hash, attempts, window_started) VALUES (?, 1, CURRENT_TIMESTAMP) ON CONFLICT(key_hash) DO UPDATE SET attempts = CASE WHEN julianday(window_started) <= julianday('now', '-15 minutes') THEN 1 ELSE attempts + 1 END, window_started = CASE WHEN julianday(window_started) <= julianday('now', '-15 minutes') THEN CURRENT_TIMESTAMP ELSE window_started END RETURNING attempts").bind(key).first();
  return Number(row?.attempts) <= 10;
}
