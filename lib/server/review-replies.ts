export async function ensureReviewReplies(db: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS review_replies (review_id INTEGER PRIMARY KEY REFERENCES reviews(id) ON DELETE CASCADE, business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, body TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
}
