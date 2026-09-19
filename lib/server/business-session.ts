import { env } from "cloudflare:workers";

const COOKIE_NAME = "khonenama_session";
const SESSION_DAYS = 30;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getCookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(";").map((part) => part.trim());
  for (const part of parts) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index);
    if (key === name) return decodeURIComponent(part.slice(index + 1));
  }
  return "";
}

export async function createBusinessSession(userId: string, request: Request) {
  const db = (env as any).DB;
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = toBase64Url(bytes);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await db
    .prepare(
      "INSERT INTO auth_sessions (token_hash, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)"
    )
    .bind(tokenHash, userId, expiresAt, (request.headers.get("user-agent") || "").slice(0, 300))
    .run();

  const cookie = [
    COOKIE_NAME + "=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=" + String(SESSION_DAYS * 24 * 60 * 60),
  ].join("; ");

  return { token, cookie, expiresAt };
}

export async function getBusinessSession(request: Request) {
  const db = (env as any).DB;
  if (!db) return null;

  const token = getCookieValue(request, COOKIE_NAME);
  if (!token) return null;

  const tokenHash = await sha256(token);
  const row = await db
    .prepare(
      "SELECT s.id AS session_id, s.user_id, s.expires_at, u.full_name, u.phone, u.phone_verified_at FROM auth_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.status = 'active' LIMIT 1"
    )
    .bind(tokenHash)
    .first();

  if (!row?.user_id) return null;

  await db
    .prepare("UPDATE auth_sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(row.session_id)
    .run();

  return row;
}

export async function destroyBusinessSession(request: Request) {
  const db = (env as any).DB;
  if (!db) return;

  const token = getCookieValue(request, COOKIE_NAME);
  if (!token) return;

  const tokenHash = await sha256(token);
  await db.prepare("DELETE FROM auth_sessions WHERE token_hash = ?").bind(tokenHash).run();
}

export function clearBusinessSessionCookie() {
  return [
    COOKIE_NAME + "=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Max-Age=0",
  ].join("; ");
}
