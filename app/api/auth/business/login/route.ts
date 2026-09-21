import { env } from "cloudflare:workers";
import { createBusinessSession } from "@/lib/server/business-session";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { isAdminRequest } from "@/lib/server/admin-session";

function normalizeDigits(value: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return value
    .replace(/[۰-۹]/g, (char) => String(fa.indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String(ar.indexOf(char)));
}

function normalizeIranPhone(value: string) {
  let phone = normalizeDigits(value).replace(/[^\d+]/g, "");
  if (phone.startsWith("+98")) phone = "0" + phone.slice(3);
  if (phone.startsWith("98") && phone.length === 12) phone = "0" + phone.slice(2);
  return phone;
}


const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_FAILURES = 10;

async function rateLimitKey(request: Request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  const bytes = new TextEncoder().encode("business-login:" + forwarded);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function ensureLoginRateLimitSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS auth_rate_limits (" +
      "key_hash TEXT PRIMARY KEY," +
      "failures INTEGER NOT NULL DEFAULT 0," +
      "window_started TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "blocked_until TEXT," +
      "updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP" +
    ")"
  ).run();
}

async function loginRateLimitState(db: any, keyHash: string) {
  await ensureLoginRateLimitSchema(db);
  const row = await db.prepare(
    "SELECT failures, window_started, blocked_until, " +
    "CASE WHEN blocked_until IS NOT NULL AND blocked_until > CURRENT_TIMESTAMP THEN 1 ELSE 0 END AS blocked " +
    "FROM auth_rate_limits WHERE key_hash = ? LIMIT 1"
  ).bind(keyHash).first();

  return {
    blocked: Boolean(row?.blocked),
    failures: Number(row?.failures || 0),
    windowStarted: String(row?.window_started || ""),
  };
}

async function recordLoginFailure(db: any, keyHash: string) {
  const current = await db.prepare(
    "SELECT failures, window_started FROM auth_rate_limits WHERE key_hash = ? LIMIT 1"
  ).bind(keyHash).first();

  const windowStartedMs = Date.parse(String(current?.window_started || ""));
  const stale =
    !Number.isFinite(windowStartedMs) ||
    Date.now() - windowStartedMs > LOGIN_WINDOW_MINUTES * 60 * 1000;

  const failures = stale ? 1 : Number(current?.failures || 0) + 1;
  const blockedUntil = failures >= LOGIN_MAX_FAILURES
    ? new Date(Date.now() + LOGIN_WINDOW_MINUTES * 60 * 1000).toISOString()
    : null;

  await db.prepare(
    "INSERT INTO auth_rate_limits (key_hash, failures, window_started, blocked_until, updated_at) " +
    "VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP) " +
    "ON CONFLICT(key_hash) DO UPDATE SET " +
      "failures = excluded.failures, " +
      "window_started = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE auth_rate_limits.window_started END, " +
      "blocked_until = excluded.blocked_until, " +
      "updated_at = CURRENT_TIMESTAMP"
  ).bind(keyHash, failures, blockedUntil, stale ? 1 : 0).run();

  return failures;
}

async function clearLoginFailures(db: any, keyHash: string) {
  await db.prepare("DELETE FROM auth_rate_limits WHERE key_hash = ?").bind(keyHash).run();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = normalizeIranPhone(typeof body?.phone === "string" ? body.phone : "");
    const password = typeof body?.password === "string" ? body.password : "";

    if (!/^09\d{9}$/.test(phone) || password.length < 8) {
      return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 400 });
    }

    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
    }

    const loginKey = await rateLimitKey(request);
    const rateState = await loginRateLimitState(db, loginKey);
    if (rateState.blocked) {
      return Response.json(
        { ok: false, error: "TOO_MANY_ATTEMPTS" },
        { status: 429, headers: { "Retry-After": String(LOGIN_WINDOW_MINUTES * 60), "Cache-Control": "no-store" } }
      );
    }

    const user = await db
      .prepare(
        "SELECT id, password_hash, password_salt, password_iterations, status FROM users WHERE phone = ? LIMIT 1"
      )
      .bind(phone)
      .first();

    if (!user?.id || user.status !== "active" || !user.password_hash) {
      await recordLoginFailure(db, loginKey);
      return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    let valid = false;
    let verifyRuntimeError = false;

    try {
      valid = await verifyPassword(
        password,
        String(user.password_hash),
        String(user.password_salt || ""),
        Number(user.password_iterations || 0)
      );
    } catch (error) {
      verifyRuntimeError = true;
      console.warn("password verification runtime error", error);
    }

    if (!valid && verifyRuntimeError && Number(user.password_iterations || 0) > 100000) {
      const adminRepairAllowed = await isAdminRequest(request);
      if (adminRepairAllowed) {
        const credentials = await hashPassword(password);
        await db
          .prepare(
            "UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, password_set_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          )
          .bind(
            credentials.hash,
            credentials.salt,
            credentials.iterations,
            user.id
          )
          .run();
        valid = true;
      } else {
        return Response.json(
          { ok: false, error: "PASSWORD_REHASH_REQUIRED" },
          { status: 409 }
        );
      }
    }

    if (!valid) {
      await recordLoginFailure(db, loginKey);
      return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await clearLoginFailures(db, loginKey);

    let membership = await db
      .prepare(
        "SELECT business_id FROM business_members WHERE user_id = ? AND status = 'active' ORDER BY joined_at DESC, business_id DESC LIMIT 1"
      )
      .bind(user.id)
      .first();

    if (!membership?.business_id) {
      const ownedBusiness = await db
        .prepare(
          "SELECT id FROM businesses WHERE owner_user_id = ? ORDER BY id DESC LIMIT 1"
        )
        .bind(user.id)
        .first();

      if (ownedBusiness?.id) {
        await db
          .prepare(
            "INSERT OR IGNORE INTO business_members (business_id, user_id, role, status, joined_at) VALUES (?, ?, 'owner', 'active', CURRENT_TIMESTAMP)"
          )
          .bind(ownedBusiness.id, user.id)
          .run();
        membership = { business_id: ownedBusiness.id };
      }
    }

    if (!membership?.business_id) {
      return Response.json({ ok: false, error: "NO_BUSINESS" }, { status: 403 });
    }

    const session = await createBusinessSession(String(user.id), request);

    return Response.json(
      { ok: true },
      {
        headers: {
          "Set-Cookie": session.cookie,
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("business login failed", error);

    if (/no such column:.*password_/i.test(message)) {
      return Response.json({ ok: false, error: "PASSWORD_SCHEMA_REQUIRED" }, { status: 503 });
    }

    return Response.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
