import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";

export async function getOwnedBusiness(request: Request) {
  const session = await getBusinessSession(request);
  if (!session?.user_id) return null;

  const db = (env as any).DB;
  const business = await db
    .prepare(
      "SELECT b.id, b.slug, b.name FROM businesses b " +
      "JOIN business_members bm ON bm.business_id = b.id " +
      "WHERE bm.user_id = ? AND bm.status = 'active' " +
      "AND bm.role IN ('owner','manager') ORDER BY b.id DESC LIMIT 1"
    )
    .bind(session.user_id)
    .first();

  if (!business?.id) return null;
  return { db, session, business };
}

export async function ensureBusinessMediaSchema(db: any) {
  const info = await db.prepare("PRAGMA table_info(business_media)").all();
  const columns = new Set((info?.results || []).map((row: any) => String(row.name)));

  const statements = [];
  if (!columns.has("provider")) {
    statements.push(db.prepare("ALTER TABLE business_media ADD COLUMN provider TEXT NOT NULL DEFAULT 'imagekit'"));
  }
  if (!columns.has("provider_file_id")) {
    statements.push(db.prepare("ALTER TABLE business_media ADD COLUMN provider_file_id TEXT"));
  }
  if (!columns.has("file_url")) {
    statements.push(db.prepare("ALTER TABLE business_media ADD COLUMN file_url TEXT"));
  }
  if (!columns.has("file_path")) {
    statements.push(db.prepare("ALTER TABLE business_media ADD COLUMN file_path TEXT"));
  }
  if (!columns.has("thumbnail_url")) {
    statements.push(db.prepare("ALTER TABLE business_media ADD COLUMN thumbnail_url TEXT"));
  }

  if (statements.length) await db.batch(statements);
}
