import { hashPassword, validatePassword } from "./password";
export async function recoveryHash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
export function recoveryConfigured(settings: any) {
  return typeof settings.RESEND_API_KEY === "string" && settings.RESEND_API_KEY.length > 10 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(settings.RECOVERY_EMAIL_FROM || "");
}
export async function ensureRecovery(db: any) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS auth_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT,token_hash TEXT NOT NULL UNIQUE,user_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,user_agent TEXT)"),
    db.prepare("CREATE TABLE IF NOT EXISTS password_reset_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL REFERENCES users(id),channel TEXT NOT NULL CHECK(channel IN ('email','sms')),destination TEXT NOT NULL,token_hash TEXT NOT NULL UNIQUE,expires_at TEXT NOT NULL,used_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE TABLE IF NOT EXISTS password_recovery_limits (key_hash TEXT PRIMARY KEY,attempts INTEGER NOT NULL DEFAULT 1,window_started TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  ]);
}
export async function requestRecovery(db: any, settings: any, email: string, phone: string, ip: string, send = fetch) {
  if (!recoveryConfigured(settings)) throw Error("EMAIL_NOT_CONFIGURED");
  await ensureRecovery(db);
  for (const value of ["ip:" + ip, "email:" + email]) {
    const key = await recoveryHash(value);
    const row = await db.prepare("INSERT INTO password_recovery_limits(key_hash) VALUES(?) ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN window_started<datetime('now','-1 hour') THEN 1 ELSE attempts+1 END,window_started=CASE WHEN window_started<datetime('now','-1 hour') THEN CURRENT_TIMESTAMP ELSE window_started END RETURNING attempts").bind(key).first();
    if (row.attempts > 5) throw Error("TOO_MANY_ATTEMPTS");
  }
  const user = await db.prepare("SELECT id FROM users WHERE lower(email)=? AND phone=? AND status='active'").bind(email, phone).first();
  if (!user) return;
  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const tokenHash = await recoveryHash(token);
  await db.prepare("INSERT INTO password_reset_tokens(token_hash,user_id,channel,destination,expires_at) VALUES(?,?,'email',?,datetime('now','+15 minutes'))").bind(tokenHash,user.id,email).run();
  const url = "https://khonenama.ir/business/forgot-password#reset=" + token;
  try {
    const response = await send("https://api.resend.com/emails", {method:"POST",headers:{Authorization:"Bearer " + settings.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"recovery-"+tokenHash},body:JSON.stringify({from:settings.RECOVERY_EMAIL_FROM,to:[email],subject:"بازیابی رمز خونه‌نما",text:`برای انتخاب رمز جدید، این لینک را باز کنید:\n${url}\nاین لینک فقط یک‌بار و تا ۱۵ دقیقه معتبر است. اگر درخواست بازیابی نداده‌اید، این ایمیل را نادیده بگیرید. رمز عبور شما در ایمیل ارسال نمی‌شود.`}),signal:AbortSignal.timeout(8000),redirect:"manual"});
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { name?: unknown } | null;
      const code = typeof detail?.name === "string" && /^[a-z_]{1,40}$/.test(detail.name) ? detail.name : "unknown";
      console.warn("RECOVERY_PROVIDER_REJECTED", response.status, code);
      throw Error("EMAIL_SEND_FAILED");
    }
  } catch (error) {
    const detail = error && typeof error === "object" ? error as {message?:unknown} : null;
    const text = typeof detail?.message === "string" ? detail.message.toLowerCase() : typeof error === "string" ? error.toLowerCase() : "";
    const category = text.includes("header") ? "invalid_header" : text.includes("fetch") || text.includes("network") ? "network_fetch" : text.includes("timeout") || text.includes("abort") ? "timeout" : "provider_failure";
    console.warn("RECOVERY_PROVIDER_FAILURE", category);
    await db.prepare("DELETE FROM password_reset_tokens WHERE token_hash=?").bind(tokenHash).run();
    throw Error("EMAIL_SEND_FAILED");
  }
  await db.batch([db.prepare("DELETE FROM password_reset_tokens WHERE expires_at<datetime('now','-1 day')"),db.prepare("DELETE FROM password_recovery_limits WHERE window_started<datetime('now','-1 day')")]);
}
export async function resetPassword(db: any, token: string, password: string) {
  if (!/^[a-f0-9]{64}$/.test(token) || validatePassword(password)) throw Error("INVALID_RESET");
  await ensureRecovery(db);
  const hashed = await hashPassword(password), tokenHash = await recoveryHash(token);
  const valid = "SELECT user_id FROM password_reset_tokens WHERE token_hash=? AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP";
  const result = await db.batch([
    db.prepare(`UPDATE users SET password_hash=?,password_salt=?,password_iterations=?,password_set_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id IN (${valid}) AND status='active'`).bind(hashed.hash,hashed.salt,hashed.iterations,tokenHash),
    db.prepare(`DELETE FROM auth_sessions WHERE user_id IN (${valid})`).bind(tokenHash),
    db.prepare(`UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE user_id IN (${valid}) AND used_at IS NULL`).bind(tokenHash),
  ]);
  if (!result[0]?.meta?.changes) throw Error("RESET_EXPIRED");
}

