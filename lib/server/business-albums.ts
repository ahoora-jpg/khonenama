import { normalizePlanCode, planPresentation } from "@/lib/business-entitlements";

export async function ensureAlbumSchema(db: any) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS business_albums (id INTEGER PRIMARY KEY AUTOINCREMENT, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_business_albums_owner ON business_albums(business_id, id)"),
    db.prepare("CREATE TABLE IF NOT EXISTS business_album_media (album_id INTEGER NOT NULL REFERENCES business_albums(id) ON DELETE CASCADE, media_id INTEGER NOT NULL REFERENCES business_media(id) ON DELETE CASCADE, PRIMARY KEY(album_id, media_id))"),
  ]);
}

export async function getAlbumLimit(db: any, businessId: number) {
  const plan = await db.prepare("SELECT p.code FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.business_id = ? AND s.status = 'active' AND (s.ends_at IS NULL OR julianday(s.ends_at) > julianday('now')) ORDER BY s.id DESC LIMIT 1").bind(businessId).first();
  return planPresentation[normalizePlanCode(plan?.code)].albumLimit;
}

export async function listBusinessAlbums(db: any, businessId: number) {
  await ensureAlbumSchema(db);
  const rows = await db.prepare("SELECT a.id, a.title, a.description, m.id AS media_id, m.file_url, m.alt_text FROM business_albums a LEFT JOIN business_album_media am ON am.album_id = a.id LEFT JOIN business_media m ON m.id = am.media_id AND m.business_id = a.business_id WHERE a.business_id = ? ORDER BY a.id DESC, m.sort_order, m.id").bind(businessId).all();
  const albums = new Map<number, { id: number; title: string; description: string; media: { id: number; url: string; altText: string }[] }>();
  for (const row of rows.results || []) {
    if (!albums.has(row.id)) albums.set(row.id, { id: row.id, title: row.title, description: row.description, media: [] });
    if (row.media_id && row.file_url) albums.get(row.id)!.media.push({ id: row.media_id, url: row.file_url, altText: row.alt_text || "" });
  }
  return [...albums.values()];
}
