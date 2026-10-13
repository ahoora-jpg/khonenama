export async function ensureBusinessModels(db: any) {
  await db.prepare("CREATE TABLE IF NOT EXISTS business_models (business_id INTEGER PRIMARY KEY, names TEXT NOT NULL DEFAULT '[]')").run();
}
export async function businessModelNames(db: any, businessId: number): Promise<string[]> {
  await ensureBusinessModels(db);
  const row = await db.prepare("SELECT names FROM business_models WHERE business_id=?").bind(businessId).first();
  try { const names=JSON.parse(row?.names || "[]"); return Array.isArray(names) ? names.filter((n:unknown)=>typeof n === "string").slice(0,100) : []; } catch { return []; }
}
