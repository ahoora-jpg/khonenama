import { getOwnedBusiness } from "@/lib/server/business-media";
import { promotionSubscription } from "@/lib/server/business-promotion";

const headers = { "Cache-Control": "private, no-store" };
async function context(request: Request) {
  const owner = await getOwnedBusiness(request);
  if (!owner) return null;
  const subscription = await promotionSubscription(owner.db, owner.business.id);
  const limit = subscription?.code === "pro" ? 1 : subscription?.code === "premium" ? 4 : 0;
  if (!limit) return null;
  await owner.db.prepare("CREATE TABLE IF NOT EXISTS business_story_selections (business_id INTEGER NOT NULL, subscription_id INTEGER NOT NULL, template_id INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (business_id, subscription_id, template_id))").run();
  return { ...owner, subscription, limit };
}
async function selections(ctx: NonNullable<Awaited<ReturnType<typeof context>>>) {
  const rows = await ctx.db.prepare("SELECT template_id FROM business_story_selections WHERE business_id=? AND subscription_id=? ORDER BY template_id").bind(ctx.business.id, ctx.subscription.id).all();
  return (rows.results || []).map((row: {template_id:number}) => Number(row.template_id));
}
export async function GET(request: Request) {
  const ctx = await context(request);
  if (!ctx) return Response.json({ok:false,error:"PAID_PLAN_REQUIRED"},{status:403,headers});
  return Response.json({ok:true,limit:ctx.limit,selected:await selections(ctx)},{headers});
}
export async function POST(request: Request) {
  const ctx = await context(request);
  if (!ctx) return Response.json({ok:false,error:"PAID_PLAN_REQUIRED"},{status:403,headers});
  const body = await request.json().catch(() => null) as {templateId?:unknown} | null;
  const id = body?.templateId;
  if (!Number.isInteger(id) || (id as number)<1 || (id as number)>24) return Response.json({ok:false,error:"INVALID_TEMPLATE"},{status:400,headers});
  await ctx.db.prepare("INSERT OR IGNORE INTO business_story_selections (business_id,subscription_id,template_id) SELECT ?,?,? WHERE (SELECT COUNT(*) FROM business_story_selections WHERE business_id=? AND subscription_id=?) < ?").bind(ctx.business.id,ctx.subscription.id,id,ctx.business.id,ctx.subscription.id,ctx.limit).run();
  const selected = await selections(ctx);
  if (!selected.includes(id as number)) return Response.json({ok:false,error:"LIMIT_REACHED",limit:ctx.limit,selected},{status:409,headers});
  return Response.json({ok:true,limit:ctx.limit,selected},{headers});
}
