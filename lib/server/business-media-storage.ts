import { env } from "cloudflare:workers";
import { deleteImageKitFile, getImageKitFileDetails, imageKitServerConfigured, uploadImageKitFile } from "@/lib/server/imagekit";

const MAX_BYTES = 8 * 1024 * 1024;
const KEY_PATTERN = /^businesses\/[1-9]\d*\/[a-f0-9-]{36}\.(?:webp|mp4)$/;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export function useR2Media() {
  return (env as any).MEDIA_STORAGE_PROVIDER === "r2";
}

export function mediaStorageConfigured() {
  return imageKitServerConfigured() && (!useR2Media() || Boolean((env as any).BUSINESS_MEDIA?.put));
}

export function thumbnailKey(key: string) {
  return key.replace(/\.webp$/, "-thumb.webp");
}

async function downloadProcessedImage(url: string): Promise<Uint8Array> {
  const parsed = new URL(url);
  const endpoint = new URL(String((env as any).IMAGEKIT_URL_ENDPOINT));
  if (parsed.protocol !== "https:" || parsed.origin !== endpoint.origin) throw new Error("INVALID_MEDIA");
  const response = await fetch(parsed, { redirect: "error", signal: AbortSignal.timeout(60_000) });
  if (!response.ok || !response.body || response.headers.get("content-type")?.split(";")[0] !== "image/webp") throw new Error("MEDIA_PROCESSING_FAILED");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("FILE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (!size) throw new Error("INVALID_MEDIA");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

export async function deleteStoredBusinessImage(provider: string, fileId: string) {
  if (provider !== "r2" && provider !== "imagekit") throw new Error("INVALID_MEDIA_PROVIDER");
  if (provider !== "r2") return deleteImageKitFile(fileId);
  if (!KEY_PATTERN.test(fileId)) throw new Error("INVALID_MEDIA_KEY");
  const bucket = (env as any).BUSINESS_MEDIA;
  if (!bucket) throw new Error("MEDIA_STORAGE_NOT_CONFIGURED");
  await bucket.delete(fileId.endsWith(".mp4") ? [fileId] : [fileId, thumbnailKey(fileId)]);
}

export async function uploadStoredBusinessImage(file: File, options: { fileName: string; folder: string; tags?: string; businessId: number }) {
  const uploaded = await uploadImageKitFile(file, options);
  let r2Key = "";
  try {
    const verified = await getImageKitFileDetails(uploaded.fileId);
    if (verified.fileId !== uploaded.fileId || !verified.filePath.startsWith(options.folder + "/") || verified.fileType !== "image" || !ALLOWED_MIME.has(verified.mime) || !Number.isFinite(verified.size) || verified.size < 1 || verified.size > MAX_BYTES || !verified.url) throw new Error("INVALID_MEDIA");
    if (!useR2Media()) return { ...verified, provider: "imagekit" };

    // ImageKit is the transitional encoder; only processed copies persist in R2.
    // Existing ImageKit gallery records remain untouched.
    if (verified.mime !== "image/webp" || !Number.isFinite(verified.width) || !Number.isFinite(verified.height) || verified.width < 1 || verified.height < 1 || verified.width > 2560 || verified.height > 2560) throw new Error("MEDIA_PROCESSING_FAILED");
    const bucket = (env as any).BUSINESS_MEDIA;
    if (!bucket) throw new Error("MEDIA_STORAGE_NOT_CONFIGURED");
    r2Key = "businesses/" + options.businessId + "/" + crypto.randomUUID() + ".webp";
    const master = await downloadProcessedImage(verified.url);
    const thumbUrl = new URL(verified.url);
    thumbUrl.searchParams.set("tr", "w-480,h-480,c-at_max,f-webp,q-85");
    const thumbnail = await downloadProcessedImage(thumbUrl.toString());
    const metadata = { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=300" }, customMetadata: { businessId: String(options.businessId) } };
    await bucket.put(r2Key, master, metadata);
    await bucket.put(thumbnailKey(r2Key), thumbnail, metadata);
    return { ...verified, provider: "r2", fileId: r2Key, filePath: r2Key, url: "https://khonenama.ir/media/" + r2Key, thumbnailUrl: "https://khonenama.ir/media/" + thumbnailKey(r2Key), size: master.byteLength };
  } catch (error) {
    if (r2Key) await deleteStoredBusinessImage("r2", r2Key).catch(() => console.error("R2 orphan cleanup failed"));
    if (!useR2Media()) await deleteImageKitFile(uploaded.fileId).catch(() => console.error("ImageKit orphan cleanup failed"));
    throw error;
  } finally {
    if (useR2Media()) await deleteImageKitFile(uploaded.fileId).catch(() => console.error("ImageKit temporary image cleanup failed"));
  }
}
