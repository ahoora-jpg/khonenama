export const LADDER_DISABLED_MESSAGE = "نردبان هنوز برای نمایش یا خرید عمومی فعال نشده است.";

export async function ensureLadderPromotion(db: any) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS ladder_settings (id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),daily_price_toman INTEGER NOT NULL DEFAULT 10000 CHECK(daily_price_toman BETWEEN 1000 AND 100000),rotation_minutes INTEGER NOT NULL DEFAULT 3 CHECK(rotation_minutes BETWEEN 1 AND 60),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("INSERT OR IGNORE INTO ladder_settings(id) VALUES(1)"),
    db.prepare("CREATE TABLE IF NOT EXISTS ladder_entries (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,amount_toman INTEGER NOT NULL CHECK(amount_toman>=0),status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','expired','cancelled')),payment_reference TEXT UNIQUE,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_ladder_entries_active ON ladder_entries(status,starts_at,ends_at,business_id)"),
  ]);
}

// The cyclic key changes only every configured interval. It is deterministic for
// all visitors in that interval, preventing different users from seeing unfair orders.
export function ladderRotationKey(businessId: number, now: Date, minutes: number) {
  const slot = Math.floor(now.getTime() / (minutes * 60_000));
  return (businessId * 1103515245 + slot * 12345) >>> 0;
}

export async function ladderSettings(db: any) {
  await ensureLadderPromotion(db);
  return db.prepare("SELECT enabled,daily_price_toman,rotation_minutes FROM ladder_settings WHERE id=1").first();
}
