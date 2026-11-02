import { verifyPassword } from "./password";
import { env } from "cloudflare:workers";

const COOKIE_NAME = "khonenama_admin";
const SESSION_HOURS = 12;

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64Url(new Uint8Array(signature));
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminConfigured() {
  return Boolean((env as any).ADMIN_ACCESS_KEY);
}

export async function verifyAdminAccessKey(value: string) {
  const secret = String((env as any).ADMIN_ACCESS_KEY || "");
  if (!secret || !value || value.length > 512) return false;
  const encoded = String((env as any).ADMIN_LOGIN_PASSWORD_HASH || "");
  if (encoded) {
    const parts = encoded.split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
    return verifyPassword(value, parts[3], parts[2], Number(parts[1]));
  }

  const [a, b] = await Promise.all([hmac(secret, "candidate:" + value), hmac(secret, "candidate:" + secret)]);
  return safeEqual(a, b);
}

export async function createAdminCookie() {
  const secret = String((env as any).ADMIN_ACCESS_KEY || "");
  if (!secret) throw new Error("ADMIN_NOT_CONFIGURED");

  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt) + "." + crypto.randomUUID().replaceAll("-", "");
  const signature = await hmac(secret, payload);
  const token = payload + "." + signature;

  return [
    COOKIE_NAME + "=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=" + String(SESSION_HOURS * 60 * 60),
  ].join("; ");
}

export async function isAdminRequest(request: Request) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    const origin = request.headers.get("origin");
    if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) return false;
  }
  const secret = String((env as any).ADMIN_ACCESS_KEY || "");
  if (!secret) return false;

  let token = "";
  try { token = cookieValue(request, COOKIE_NAME); } catch { return false; }
  if (!token) return false;

  const parts = token.split(".");
  // Accept existing two-part sessions until expiry during this additive migration.
  if (parts.length !== 2 && parts.length !== 3) return false;
  if (parts.length === 3 && !/^[a-f0-9]{32}$/.test(parts[1])) return false;
  const signature = parts[parts.length - 1];
  const payload = parts.slice(0, -1).join(".");
  const expiresAt = Number(parts[0]);
  if (!payload || !signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || expiresAt > Date.now() + SESSION_HOURS * 60 * 60 * 1000) return false;

  const expected = await hmac(secret, payload);
  return safeEqual(signature, expected);
}

export function clearAdminCookie() {
  return [
    COOKIE_NAME + "=",
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=0",
  ].join("; ");
}
