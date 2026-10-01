import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";

async function serve(request: Request, context: { params: Promise<{ businessId: string; fileName: string }> }) {
  const { businessId, fileName } = await context.params;
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^[1-9]\d*$/.test(businessId) || !/^[a-f0-9-]{36}(?:-thumb)?\.webp$/.test(fileName)) return missing();
  const bucket = (env as any).BUSINESS_MEDIA;
  if (!bucket) return missing();
  const masterName = fileName.replace(/-thumb\.webp$/, ".webp");
  const masterKey = "businesses/" + businessId + "/" + masterName;
  const db = (env as any).DB;
  const media = await db.prepare(
    "SELECT b.status, COALESCE(v.owner_paused, 0) AS owner_paused FROM business_media m JOIN businesses b ON b.id = m.business_id LEFT JOIN business_visibility_controls v ON v.business_id = b.id WHERE m.business_id = ? AND m.provider = 'r2' AND m.storage_key = ? LIMIT 1"
  ).bind(Number(businessId), masterKey).first();
  if (!media) return missing();
  const isPublic = media.status === "published" && !Number(media.owner_paused);
  if (!isPublic) {
    const session = await getBusinessSession(request);
    if (!session?.user_id) return missing();
    const member = await db.prepare("SELECT 1 AS allowed FROM business_members WHERE business_id = ? AND user_id = ? AND status = 'active' AND role IN ('owner','manager') LIMIT 1").bind(Number(businessId), session.user_id).first();
    if (!member) return missing();
  }
  const object = request.method === "HEAD"
    ? await bucket.head("businesses/" + businessId + "/" + fileName)
    : await bucket.get("businesses/" + businessId + "/" + fileName);
  if (!object) return missing();
  const headers = new Headers({
    "Content-Type": "image/webp",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": isPublic ? "public, max-age=300" : "private, no-store",
    "ETag": object.httpEtag,
    "Vary": "Cookie",
  });
  if (request.headers.get("if-none-match") === object.httpEtag) return new Response(null, { status: 304, headers });
  headers.set("Content-Length", String(object.size));
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

export const GET = serve;
export const HEAD = serve;
