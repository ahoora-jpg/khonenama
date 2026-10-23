import { env } from "cloudflare:workers";
import { GET as getBusinessMedia } from "@/app/media/businesses/[businessId]/[fileName]/route";

const CHUNK_SIZE = 48_000;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const STATIC_IMAGE = /^\/images\/[a-z0-9/_-]+\.webp$/;
const BUSINESS_IMAGE = /^\/media\/businesses\/([1-9]\d*)\/([a-f0-9-]{36}(?:-thumb)?\.webp)$/;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") || "";
  const index = Number(url.searchParams.get("index"));
  if (!Number.isSafeInteger(index) || index < 0 || index > Math.ceil(MAX_IMAGE_SIZE / CHUNK_SIZE)) {
    return new Response(null, { status: 400 });
  }

  let source: Response;
  if (STATIC_IMAGE.test(path)) {
    const assets = (env as any).ASSETS;
    if (!assets?.fetch) return new Response(null, { status: 503 });
    source = await assets.fetch(new Request(new URL(path, url.origin)));
  } else {
    const match = BUSINESS_IMAGE.exec(path);
    if (!match) return new Response(null, { status: 400 });
    // The media route checks publication and plan limits. No visitor cookie is forwarded.
    source = await getBusinessMedia(new Request(new URL(path, url.origin)), {
      params: Promise.resolve({ businessId: match[1], fileName: match[2] }),
    });
  }
  if (!source.ok || source.headers.get("content-type")?.split(";")[0] !== "image/webp") {
    return new Response(null, { status: source.status === 404 ? 404 : 502 });
  }

  const bytes = await source.arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > MAX_IMAGE_SIZE) return new Response(null, { status: 413 });
  const start = index * CHUNK_SIZE;
  if (start >= bytes.byteLength) return new Response(null, { status: 416 });
  const chunk = bytes.slice(start, Math.min(start + CHUNK_SIZE, bytes.byteLength));
  return new Response(chunk, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(chunk.byteLength),
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "X-Image-Length": String(bytes.byteLength),
      "X-Image-Type": "image/webp",
      "X-Chunk-Index": String(index),
    },
  });
}
