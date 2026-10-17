import { env } from "cloudflare:workers";

export async function GET(request: Request, context: {params: Promise<{token:string}>}) {
  const {token} = await context.params;
  const headers = {"Cache-Control":"no-store", "X-Robots-Tag":"noindex, nofollow"};
  if (!/^[a-f0-9]{32}$/.test(token)) return new Response("لینک معتبر نیست.",{status:404,headers});
  const db = (env as any).DB;
  let row;
  try {
    row = await db.prepare("SELECT b.slug FROM business_promotion_links l JOIN businesses b ON b.id=l.business_id JOIN subscriptions s ON s.id=l.subscription_id AND s.business_id=l.business_id JOIN plans p ON p.id=s.plan_id LEFT JOIN business_visibility_controls v ON v.business_id=b.id WHERE l.token=? AND l.revoked=0 AND b.status='published' AND COALESCE(v.owner_paused,0)=0 AND s.status='active' AND p.code IN ('pro','premium') AND (l.expires_at IS NULL OR julianday(l.expires_at)>julianday('now')) AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now'))").bind(token).first();
  } catch {
    return new Response("دریافت لینک ممکن نشد؛ دوباره تلاش کنید.",{status:503,headers});
  }
  if (!row) return new Response("اعتبار این لینک تبلیغاتی پایان یافته است.",{status:410,headers});
  const target = new URL("/business/"+encodeURIComponent(row.slug),request.url);
  target.searchParams.set("utm_source","khonenama-promotion");
  return new Response(null,{status:302,headers:{...headers,Location:target.toString()}});
}
