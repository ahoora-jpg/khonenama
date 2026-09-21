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

function imageKitAuthHeader(privateKey: string) {
  return "Basic " + btoa(privateKey + ":");
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

export type ImageKitFileDetails = {
  fileId: string;
  name: string;
  filePath: string;
  url: string;
  thumbnailUrl: string;
  fileType: string;
  mime: string;
  size: number;
};

export async function getImageKitFileDetails(fileId: string): Promise<ImageKitFileDetails> {
  const { privateKey } = getImageKitConfig();
  if (!privateKey) throw new Error("IMAGEKIT_NOT_CONFIGURED");

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" + encodeURIComponent(fileId),
    {
      method: "GET",
      headers: { Authorization: imageKitAuthHeader(privateKey) },
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error("IMAGEKIT_FILE_LOOKUP_FAILED:" + response.status + ":" + body.slice(0, 300));
  }

  const details: any = await response.json();
  return {
    fileId: typeof details?.fileId === "string" ? details.fileId : "",
    name: typeof details?.name === "string" ? details.name : "",
    filePath: typeof details?.filePath === "string" ? details.filePath : "",
    url: typeof details?.url === "string" ? details.url : "",
    thumbnailUrl:
      typeof details?.thumbnail === "string"
        ? details.thumbnail
        : typeof details?.thumbnailUrl === "string"
          ? details.thumbnailUrl
          : "",
    fileType: typeof details?.fileType === "string" ? details.fileType : "",
    mime: typeof details?.mime === "string" ? details.mime : "",
    size: Number(details?.size || 0),
  };
}

export async function deleteImageKitFile(fileId: string) {
  const { privateKey } = getImageKitConfig();
  if (!privateKey) throw new Error("IMAGEKIT_NOT_CONFIGURED");

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" + encodeURIComponent(fileId),
    {
      method: "DELETE",
      headers: { Authorization: imageKitAuthHeader(privateKey) },
    }
  );

  if (!response.ok && response.status !== 404) {
    const body = await response.text().catch(() => "");
    throw new Error("IMAGEKIT_DELETE_FAILED:" + response.status + ":" + body.slice(0, 300));
  }
}
