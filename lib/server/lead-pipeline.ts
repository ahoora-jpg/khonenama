export async function ensureLeadPipelineSchema(db: any) {
  const info = await db.prepare("PRAGMA table_info(lead_recipients)").all();
  const columns = new Set((info?.results || []).map((row: any) => String(row.name)));
  const statements = [];

  if (!columns.has("business_status")) {
    statements.push(
      db.prepare("ALTER TABLE lead_recipients ADD COLUMN business_status TEXT NOT NULL DEFAULT 'new'")
    );
  }
  if (!columns.has("quoted_amount")) {
    statements.push(
      db.prepare("ALTER TABLE lead_recipients ADD COLUMN quoted_amount INTEGER")
    );
  }
  if (!columns.has("private_note")) {
    statements.push(
      db.prepare("ALTER TABLE lead_recipients ADD COLUMN private_note TEXT")
    );
  }
  if (!columns.has("updated_at")) {
    statements.push(
      db.prepare("ALTER TABLE lead_recipients ADD COLUMN updated_at TEXT")
    );
  }

  if (statements.length) await db.batch(statements);

  await db.prepare(
    "CREATE INDEX IF NOT EXISTS idx_lead_recipients_business_status ON lead_recipients(business_id, business_status, lead_id)"
  ).run();
}
