import { env } from "cloudflare:workers";

function getEnvValue(name: string) {
  const value = (env as any)?.[name];
  return typeof value === "string" ? value.trim() : "";
}

export function getImageKitConfig() {
  return {
    publicKey: getEnvValue("IMAGEKIT_PUBLIC_KEY"),
    privateKey: getEnvValue("IMAGEKIT_PRIVATE_KEY"),
    urlEndpoint: getEnvValue("IMAGEKIT_URL_ENDPOINT"),
  };
}

export function imageKitConfigured() {
  const config = getImageKitConfig();
  return Boolean(config.publicKey && config.privateKey && config.urlEndpoint);
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createImageKitUploadAuth() {
  const { publicKey, privateKey } = getImageKitConfig();
  if (!publicKey || !privateKey) throw new Error("IMAGEKIT_NOT_CONFIGURED");

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 20 * 60;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(privateKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(token + String(expire))
  );

  return {
    token,
    expire,
    signature: hex(signatureBuffer),
    publicKey,
  };
}

export async function deleteImageKitFile(fileId: string) {
  const { privateKey } = getImageKitConfig();
  if (!privateKey) throw new Error("IMAGEKIT_NOT_CONFIGURED");

  const encoded = btoa(privateKey + ":");
  const response = await fetch(
    "https://api.imagekit.io/v1/files/" + encodeURIComponent(fileId),
    {
      method: "DELETE",
      headers: { Authorization: "Basic " + encoded },
    }
  );

  if (!response.ok && response.status !== 404) {
    const body = await response.text().catch(() => "");
    throw new Error("IMAGEKIT_DELETE_FAILED:" + response.status + ":" + body.slice(0, 300));
  }
}
