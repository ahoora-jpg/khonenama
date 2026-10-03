import { getOwnedBusiness } from "@/lib/server/business-media";
import { ensureAlbumSchema, getAlbumLimit, listBusinessAlbums } from "@/lib/server/business-albums";

const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers });
  const [albums, limit] = await Promise.all([listBusinessAlbums(owned.db, owned.business.id), getAlbumLimit(owned.db, owned.business.id)]);
  return Response.json({ ok: true, albums, limit }, { headers });
}
export async function POST(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim() || body.title.length > 100 || typeof body.description !== "string" || body.description.length > 2000 || !Array.isArray(body.mediaIds)) return Response.json({ ok: false, error: "INVALID_ALBUM" }, { status: 400, headers });
  const ids = [...new Set<number>(body.mediaIds)];
  if (!ids.length || ids.length > 60 || ids.some(id => !Number.isSafeInteger(id) || id < 1)) return Response.json({ ok: false, error: "INVALID_MEDIA" }, { status: 400, headers });
  const limit = await getAlbumLimit(owned.db, owned.business.id);
  if (!limit) return Response.json({ ok: false, error: "PAID_PLAN_REQUIRED" }, { status: 403, headers });
  await ensureAlbumSchema(owned.db);
  const placeholders = ids.map(() => "?").join(",");
  const count = await owned.db.prepare("SELECT COUNT(*) AS n FROM business_media WHERE business_id = ? AND id IN (" + placeholders + ")").bind(owned.business.id, ...ids).first();
  if (Number(count?.n) !== ids.length) return Response.json({ ok: false, error: "INVALID_MEDIA" }, { status: 400, headers });
  // One D1 batch transaction: ownership and quota are checked again at insertion.
  const id = parseInt(crypto.randomUUID().replace(/-/g, "").slice(0, 12), 16) || 1;
  const statements = [
    owned.db.prepare("INSERT INTO business_albums (id, business_id, title, description) SELECT ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM business_albums WHERE business_id = ?) < ? AND (SELECT COUNT(*) FROM business_media WHERE business_id = ? AND id IN (" + placeholders + ")) = ?").bind(id, owned.business.id, body.title.trim(), body.description.trim(), owned.business.id, limit, owned.business.id, ...ids, ids.length),
    owned.db.prepare("INSERT INTO business_album_media (album_id, media_id) SELECT a.id, m.id FROM business_albums a JOIN business_media m ON m.business_id = a.business_id WHERE a.id = ? AND a.business_id = ? AND m.id IN (" + placeholders + ")").bind(id, owned.business.id, ...ids),
  ];
  const result = await owned.db.batch(statements);
  if (!result[0]?.meta?.changes) return Response.json({ ok: false, error: "ALBUM_LIMIT_REACHED" }, { status: 409, headers });
  return Response.json({ ok: true, id }, { status: 201, headers });
}
export async function DELETE(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401, headers });
  const body = await request.json().catch(() => null);
  if (!Number.isSafeInteger(body?.id) || body.id < 1) return Response.json({ ok: false, error: "INVALID_ALBUM" }, { status: 400, headers });
  await ensureAlbumSchema(owned.db);
  const result = await owned.db.prepare("DELETE FROM business_albums WHERE id = ? AND business_id = ?").bind(body.id, owned.business.id).run();
  return Response.json({ ok: Boolean(result.meta.changes) }, { status: result.meta.changes ? 200 : 404, headers });
}
