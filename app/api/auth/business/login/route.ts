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

    const user = await db
      .prepare(
        "SELECT id, password_hash, password_salt, password_iterations, status FROM users WHERE phone = ? LIMIT 1"
      )
      .bind(phone)
      .first();

    if (!user?.id || user.status !== "active" || !user.password_hash) {
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
      return Response.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

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
