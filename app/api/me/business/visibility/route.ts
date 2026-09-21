import { getOwnedBusiness } from "@/lib/server/business-media";

async function ensureSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_visibility_controls (" +
      "business_id INTEGER PRIMARY KEY," +
      "owner_paused INTEGER NOT NULL DEFAULT 0," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE" +
    ")"
  ).run();
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok:false, error:"UNAUTHENTICATED" }, { status:401 });
  await ensureSchema(owned.db);
  const row = await owned.db.prepare(
    "SELECT owner_paused FROM business_visibility_controls WHERE business_id = ? LIMIT 1"
  ).bind(owned.business.id).first();
  return Response.json({ ok:true, ownerPaused:Boolean(row?.owner_paused) }, { headers:{ "Cache-Control":"no-store" } });
}

export async function PATCH(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok:false, error:"UNAUTHENTICATED" }, { status:401 });
  await ensureSchema(owned.db);

  const body = await request.json().catch(() => ({}));
  const ownerPaused = Boolean(body?.ownerPaused);

  await owned.db.prepare(
    "INSERT INTO business_visibility_controls (business_id, owner_paused, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) " +
    "ON CONFLICT(business_id) DO UPDATE SET owner_paused = excluded.owner_paused, updated_at = CURRENT_TIMESTAMP"
  ).bind(owned.business.id, ownerPaused ? 1 : 0).run();

  return Response.json({ ok:true, ownerPaused });
}
