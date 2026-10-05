async function ensure(db: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS lead_access_tokens (lead_id INTEGER PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE, token TEXT NOT NULL)").run();
}
export async function createLeadAccessCode(db: any, id: number) {
  await ensure(db);
  const token = crypto.randomUUID().replace(/-/g, "");
  await db.prepare("INSERT INTO lead_access_tokens(lead_id,token) VALUES (?,?)").bind(id,token).run();
  return `KH-${String(id).padStart(6,"0")}-${token}`;
}
export async function verifyLeadAccessCode(db: any, code: string) {
  const match = code.trim().match(/^KH-0*(\d+)-([a-f0-9]{32})$/i);
  if (!match || !Number.isSafeInteger(Number(match[1]))) return null;
  await ensure(db);
  const row = await db.prepare("SELECT lead_id FROM lead_access_tokens WHERE lead_id=? AND token=?").bind(Number(match[1]),match[2].toLowerCase()).first();
  return row ? Number(row.lead_id) : null;
}
