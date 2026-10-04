export async function ensureSupportTickets(db: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS support_tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, business_slug TEXT, review_id INTEGER, contact TEXT NOT NULL, message TEXT NOT NULL, tracking_token TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', admin_reply TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}
