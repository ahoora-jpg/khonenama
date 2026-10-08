import { VIDEO_LIMITS } from "@/lib/business-video";
import { normalizePlanCode } from "@/lib/business-entitlements";
import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";

async function serve(request: Request, context: { params: Promise<{ businessId: string; fileName: string }> }) {
  const { businessId, fileName } = await context.params;
  const missing = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!/^[1-9]\d*$/.test(businessId) || !/^[a-f0-9-]{36}(?:-thumb)?\.webp$|^[a-f0-9-]{36}\.mp4$/.test(fileName)) return missing();
  const bucket = (env as any).BUSINESS_MEDIA;
  if (!bucket) return missing();
  const masterName = fileName.replace(/-thumb\.webp$/, ".webp");
  const masterKey = "businesses/" + businessId + "/" + masterName;
  const db = (env as any).DB;
  const media = await db.prepare(
    "SELECT b.status, COALESCE(v.owner_paused, 0) AS owner_paused FROM business_media m JOIN businesses b ON b.id = m.business_id LEFT JOIN business_visibility_controls v ON v.business_id = b.id WHERE m.business_id = ? AND m.provider = 'r2' AND m.storage_key = ? LIMIT 1"
  ).bind(Number(businessId), masterKey).first();
  if (!media) return missing();
  let isPublic = media.status === "published" && !Number(media.owner_paused);
  if (isPublic && fileName.endsWith(".mp4")) {
    const plan=await db.prepare("SELECT p.code FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')) ORDER BY s.id DESC LIMIT 1").bind(Number(businessId)).first();
    const allowed=await db.prepare("SELECT storage_key FROM business_media WHERE business_id=? AND media_type='video' ORDER BY id LIMIT ?").bind(Number(businessId),VIDEO_LIMITS[normalizePlanCode(plan?.code)]).all();
    isPublic=(allowed.results||[]).some((row:any)=>row.storage_key===masterKey);
  }
  if (!isPublic) {
    const session = await getBusinessSession(request);
    if (!session?.user_id) return missing();
    const member = await db.prepare("SELECT 1 AS allowed FROM business_members WHERE business_id = ? AND user_id = ? AND status = 'active' AND role IN ('owner','manager') LIMIT 1").bind(Number(businessId), session.user_id).first();
    if (!member) return missing();
  }
  const key="businesses/"+businessId+"/"+fileName;
  const range=request.method === "GET" && fileName.endsWith(".mp4") ? request.headers.get("range") : null;
  let offset=0, length=0, total=0;
  if(range){
    const meta=await bucket.head(key); if(!meta)return missing(); total=meta.size;
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(match && (match[1] || match[2])) {
      offset=match[1]?Number(match[1]):Math.max(0,total-Number(match[2]));
      const end=match[1]&&match[2]?Math.min(total-1,Number(match[2])):total-1;
      length=end-offset+1;
    }
    if(!match || offset>=total || length<=0 || !Number.isSafeInteger(offset) || !Number.isSafeInteger(length)) return new Response(null,{status:416,headers:{"Content-Range":"bytes */"+total,"Cache-Control":"no-store"}});
  }
  const object = request.method === "HEAD"
    ? await bucket.head("businesses/" + businessId + "/" + fileName)
    : await bucket.get(key, range ? {range:{offset,length}} : undefined);
  if (!object) return missing();
  const headers = new Headers({
    "Content-Type": fileName.endsWith(".mp4") ? "video/mp4" : "image/webp",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": isPublic && !fileName.endsWith(".mp4") ? "public, max-age=300" : "private, no-store",
    "ETag": object.httpEtag,
    "Vary": "Cookie",
  });
  if (request.headers.get("if-none-match") === object.httpEtag) return new Response(null, { status: 304, headers });
  headers.set("Accept-Ranges", "bytes");
  if (range) headers.set("Content-Range", "bytes "+offset+"-"+(offset+length-1)+"/"+total);
  headers.set("Content-Length", String(range ? length : object.size));
  return new Response(request.method === "HEAD" ? null : object.body, { status: range ? 206 : 200, headers });
}

export const GET = serve;
export const HEAD = serve;
