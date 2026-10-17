import { normalizePlanCode } from "@/lib/business-entitlements";
import { allowedStoryTemplates } from "@/lib/story-templates";

export async function promotionSubscription(db: any, businessId: number) {
  return db.prepare("SELECT s.id, s.ends_at, p.code FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=? AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')) ORDER BY s.id DESC LIMIT 1").bind(businessId).first();
}

export function storyTemplateCount(code: unknown) {
  const plan = normalizePlanCode(code);
  return allowedStoryTemplates(plan).length;
}

export async function promotionLink(db: any, businessId: number, subscription: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS business_visibility_controls (business_id INTEGER PRIMARY KEY,owner_paused INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await db.prepare("CREATE TABLE IF NOT EXISTS business_promotion_links (token TEXT PRIMARY KEY, business_id INTEGER NOT NULL, subscription_id INTEGER NOT NULL, expires_at TEXT, revoked INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(business_id,subscription_id))").run();
  const token = crypto.randomUUID().replace(/-/g, "");
  await db.prepare("INSERT OR IGNORE INTO business_promotion_links (token,business_id,subscription_id,expires_at) VALUES (?,?,?,?)").bind(token,businessId,subscription.id,subscription.ends_at).run();
  const row = await db.prepare("SELECT token FROM business_promotion_links WHERE business_id=? AND subscription_id=? AND revoked=0 AND (expires_at IS NULL OR julianday(expires_at)>julianday('now'))").bind(businessId,subscription.id).first();
  return row ? "https://khonenama.ir/p/" + row.token : null;
}
