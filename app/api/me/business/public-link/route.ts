import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";
import { normalizeBusinessSlug, validateBusinessSlug } from "@/lib/business-slug";

async function context(request: Request) {
  const session = await getBusinessSession(request);
  if (!session?.user_id) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const db = (env as any).DB;
  const membership = await db
    .prepare(
      "SELECT b.id, b.slug, b.status FROM businesses b JOIN business_members bm ON bm.business_id = b.id WHERE bm.user_id = ? AND bm.status = 'active' AND bm.role IN ('owner','manager') ORDER BY b.id DESC LIMIT 1"
    )
    .bind(session.user_id)
    .first();

  if (!membership?.id) {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_slug_history (old_slug TEXT PRIMARY KEY, business_id INTEGER NOT NULL, replaced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE)"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_business_slug_history_business ON business_slug_history(business_id, replaced_at)"
  ).run();

  await db.prepare("CREATE TABLE IF NOT EXISTS business_slug_edits (id TEXT PRIMARY KEY, business_id INTEGER NOT NULL, old_slug TEXT NOT NULL, new_slug TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  return {db,membership};
}
export async function GET(request: Request) {
  const owned = await context(request); if(owned instanceof Response) return owned;
  const row = await owned.db.prepare("SELECT COUNT(*) AS n FROM business_slug_edits WHERE business_id=?").bind(owned.membership.id).first();
  return Response.json({ok:true,remaining:Math.max(0,2-Number(row?.n||0))},{headers:{"Cache-Control":"private, no-store"}});
}
export async function PATCH(request: Request) {
  const owned = await context(request); if(owned instanceof Response) return owned;
  const {db,membership}=owned;
  const body = await request.json().catch(() => ({}));
  const requested = typeof body?.slug === "string" ? body.slug : "";
  const checked = validateBusinessSlug(requested);

  if (!checked.ok) {
    return Response.json({ ok: false, error: checked.error, slug: checked.slug }, { status: 400 });
  }

  const slug = normalizeBusinessSlug(checked.slug);
  if (slug === membership.slug) {
    return Response.json({
      ok: true,
      slug,
      publicUrl: "https://khonenama.ir/business/" + slug,
      unchanged: true,
    });
  }

  const [currentOwner, historicOwner] = await Promise.all([
    db.prepare("SELECT id FROM businesses WHERE slug = ? LIMIT 1").bind(slug).first(),
    db.prepare("SELECT business_id FROM business_slug_history WHERE old_slug = ? LIMIT 1").bind(slug).first(),
  ]);

  if ((currentOwner?.id && Number(currentOwner.id) !== Number(membership.id)) || historicOwner?.business_id) {
    return Response.json({ ok: false, error: "SLUG_TAKEN" }, { status: 409 });
  }

  const editId=crypto.randomUUID();
  const results = await db.batch([
    db.prepare("INSERT INTO business_slug_edits (id,business_id,old_slug,new_slug) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM business_slug_edits WHERE business_id=?)<2 AND EXISTS(SELECT 1 FROM businesses WHERE id=? AND slug=?) AND NOT EXISTS(SELECT 1 FROM businesses WHERE slug=?) AND NOT EXISTS(SELECT 1 FROM business_slug_history WHERE old_slug=?)").bind(editId,membership.id,membership.slug,slug,membership.id,membership.id,membership.slug,slug,slug),
    db.prepare("UPDATE businesses SET slug=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM business_slug_edits WHERE id=?)").bind(slug,membership.id,editId),
    db.prepare("INSERT OR IGNORE INTO business_slug_history (old_slug,business_id) SELECT ?,? WHERE EXISTS(SELECT 1 FROM business_slug_edits WHERE id=?)").bind(membership.slug,membership.id,editId),
  ]);
  if(!results[0]?.meta?.changes) return Response.json({ok:false,error:"SLUG_CHANGE_LIMIT_OR_CONFLICT"},{status:409});
  const used=await db.prepare("SELECT COUNT(*) AS n FROM business_slug_edits WHERE business_id=?").bind(membership.id).first();

  return Response.json({ok:true,slug,publicUrl:"https://khonenama.ir/business/"+slug,redirectedFrom:membership.slug,remaining:Math.max(0,2-Number(used?.n||0))});
}
