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
  if (!secret || !value) return false;

  const [a, b] = await Promise.all([hmac(secret, "candidate:" + value), hmac(secret, "candidate:" + secret)]);
  return safeEqual(a, b);
}

export async function createAdminCookie() {
  const secret = String((env as any).ADMIN_ACCESS_KEY || "");
  if (!secret) throw new Error("ADMIN_NOT_CONFIGURED");

  const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payload = String(expiresAt);
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
  const secret = String((env as any).ADMIN_ACCESS_KEY || "");
  if (!secret) return false;

  const token = cookieValue(request, COOKIE_NAME);
  if (!token) return false;

  const [payload, signature] = token.split(".");
  const expiresAt = Number(payload);
  if (!payload || !signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

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
