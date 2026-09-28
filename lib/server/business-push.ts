export async function ensurePushSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS business_push_tokens (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT," +
      "business_id INTEGER NOT NULL," +
      "user_id TEXT NOT NULL," +
      "expo_push_token TEXT NOT NULL UNIQUE," +
      "platform TEXT NOT NULL DEFAULT 'android'," +
      "active INTEGER NOT NULL DEFAULT 1," +
      "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ")"
  ).run();
  await db.prepare("CREATE INDEX IF NOT EXISTS idx_business_push_active ON business_push_tokens(business_id, active)").run();
}

export async function sendBusinessLeadPush(db: any, businessId: number, leadId: number) {
  try {
    await ensurePushSchema(db);
    const result = await db.prepare(
      "SELECT expo_push_token FROM business_push_tokens WHERE business_id = ? AND active = 1 ORDER BY updated_at DESC LIMIT 10"
    ).bind(businessId).all();
    const messages = (result?.results || []).map((row: any) => ({
      to: String(row.expo_push_token),
      sound: "default",
      title: "درخواست جدید خونه‌نما",
      body: `یک مشتری درخواست شماره ${leadId} را برای کسب‌وکار شما فرستاد.`,
      data: { url: `/owner/request/${leadId}`, leadId },
      channelId: "business-requests",
      priority: "high",
    }));
    if (!messages.length) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (error) {
    console.warn("business push delivery unavailable", error);
  }
}
