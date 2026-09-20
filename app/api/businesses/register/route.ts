import { env } from "cloudflare:workers";
import { createBusinessSession } from "@/lib/server/business-session";
import {
  BUSINESS_CATEGORY_BY_SLUG,
  categoryForService,
  isBusinessCategorySlug,
  servicesForCategories,
} from "@/lib/business-taxonomy";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/server/password";

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

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function serviceSlug(category: string, service: string) {
  const list = BUSINESS_CATEGORY_BY_SLUG[category as keyof typeof BUSINESS_CATEGORY_BY_SLUG]?.services || [];
  const index = list.indexOf(service);
  return category + "-" + String(Math.max(index, 0) + 1).padStart(2, "0");
}

export async function POST(request: Request) {
  let stage = "start";
  let createdBusinessId: number | null = null;

  try {
    stage = "parse-request";
    const body = await request.json();

    const ownerName = cleanText(body?.ownerName, 120);
    const phone = normalizeIranPhone(cleanText(body?.phone, 32));
    const email = cleanText(body?.email, 160).toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";
    const businessName = cleanText(body?.businessName, 180);
    const city = cleanText(body?.city, 100);
    const area = cleanText(body?.area, 100);
    const address = cleanText(body?.address, 700);
    const instagram = cleanText(body?.instagram, 160);
    const website = cleanText(body?.website, 240);
    const description = cleanText(body?.description, 2000);

    const requestedCategories: string[] = Array.isArray(body?.categories)
      ? body.categories.map((item: unknown) => cleanText(item, 80))
      : body?.category
        ? [cleanText(body.category, 80)]
        : [];

    const categories = [...new Set(requestedCategories.filter(isBusinessCategorySlug))];

    const requestedServices: string[] = Array.isArray(body?.services)
      ? body.services.map((item: unknown) => cleanText(item, 120))
      : [];

    const requestedAreas: string[] = Array.isArray(body?.serviceAreas)
      ? body.serviceAreas.map((item: unknown) => cleanText(item, 100))
      : [];

    if (ownerName.length < 2 || businessName.length < 2 || city.length < 2) {
      return Response.json({ ok: false, error: "INVALID_REQUIRED_FIELDS" }, { status: 400 });
    }

    if (!/^09\d{9}$/.test(phone)) {
      return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return Response.json({ ok: false, error: passwordError }, { status: 400 });
    }

    if (!categories.length) {
      return Response.json({ ok: false, error: "INVALID_CATEGORY" }, { status: 400 });
    }

    const allowedServices = new Set(servicesForCategories(categories));
    const selectedServices = [...new Set(requestedServices.filter((item) => allowedServices.has(item)))];
    const selectedAreas = [...new Set(requestedAreas.filter(Boolean))].slice(0, 30);

    if (!selectedServices.length || !selectedAreas.length || description.length < 20) {
      return Response.json({ ok: false, error: "INCOMPLETE_PROFILE" }, { status: 400 });
    }

    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
    }

    stage = "category-lookup";
    const placeholders = categories.map(() => "?").join(",");
    const categoryResult = await db
      .prepare("SELECT id, slug FROM categories WHERE is_active = 1 AND slug IN (" + placeholders + ")")
      .bind(...categories)
      .all();

    const categoryRows = categoryResult?.results || [];
    if (categoryRows.length !== categories.length) {
      return Response.json({ ok: false, error: "CATEGORY_NOT_FOUND" }, { status: 409 });
    }

    const categoryIdBySlug = new Map<string, number>(
      categoryRows.map((row: any) => [String(row.slug), Number(row.id)])
    );

    stage = "user-lookup";
    const existingUser = await db
      .prepare("SELECT id, email, password_hash, password_salt, password_iterations FROM users WHERE phone = ? LIMIT 1")
      .bind(phone)
      .first();

    let userId = existingUser?.id as string | undefined;

    if (email) {
      const emailOwner = await db
        .prepare("SELECT id, phone FROM users WHERE lower(email) = lower(?) LIMIT 1")
        .bind(email)
        .first();

      if (emailOwner?.id && emailOwner.id !== userId) {
        return Response.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
      }
    }

    stage = "password-check";
    if (userId && existingUser?.password_hash) {
      const valid = await verifyPassword(
        password,
        String(existingUser.password_hash),
        String(existingUser.password_salt || ""),
        Number(existingUser.password_iterations || 0)
      );
      if (!valid) {
        return Response.json({ ok: false, error: "INVALID_EXISTING_PASSWORD" }, { status: 401 });
      }
    }

    stage = "user-save";
    if (!userId) {
      userId = "usr_" + crypto.randomUUID();
      const credentials = await hashPassword(password);

      await db
        .prepare(
          "INSERT INTO users (id, phone, email, full_name, password_hash, password_salt, password_iterations, password_set_at, status) VALUES (?, ?, NULLIF(?, ''), ?, ?, ?, ?, CURRENT_TIMESTAMP, 'active')"
        )
        .bind(
          userId,
          phone,
          email,
          ownerName,
          credentials.hash,
          credentials.salt,
          credentials.iterations
        )
        .run();
    } else if (!existingUser?.password_hash) {
      const credentials = await hashPassword(password);
      await db
        .prepare(
          "UPDATE users SET full_name = ?, email = COALESCE(NULLIF(?, ''), email), password_hash = ?, password_salt = ?, password_iterations = ?, password_set_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(
          ownerName,
          email,
          credentials.hash,
          credentials.salt,
          credentials.iterations,
          userId
        )
        .run();
    } else {
      await db
        .prepare(
          "UPDATE users SET full_name = ?, email = COALESCE(NULLIF(?, ''), email), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        )
        .bind(ownerName, email, userId)
        .run();
    }

    stage = "business-create";
    const slug = "business-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const business = await db
      .prepare(
        "INSERT INTO businesses (slug, name, description, city, area, address, phone, website, instagram, status, verification_status, owner_user_id) VALUES (?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, NULLIF(?, ''), NULLIF(?, ''), 'draft', 'unverified', ?) RETURNING id"
      )
      .bind(slug, businessName, description, city, area, address, phone, website, instagram, userId)
      .first();

    createdBusinessId = Number(business?.id);
    if (!createdBusinessId) {
      return Response.json({ ok: false, error: "BUSINESS_CREATE_FAILED" }, { status: 500 });
    }

    stage = "business-relations";
    const relationStatements = [
      db
        .prepare(
          "INSERT OR IGNORE INTO business_members (business_id, user_id, role, status, joined_at) VALUES (?, ?, 'owner', 'active', CURRENT_TIMESTAMP)"
        )
        .bind(createdBusinessId, userId),
      ...categories.map((slugValue, index) =>
        db
          .prepare(
            "INSERT OR IGNORE INTO business_categories (business_id, category_id, is_primary) VALUES (?, ?, ?)"
          )
          .bind(createdBusinessId, categoryIdBySlug.get(slugValue), index === 0 ? 1 : 0)
      ),
      ...selectedAreas.map((serviceArea, index) =>
        db
          .prepare(
            "INSERT INTO business_service_areas (business_id, city, area, is_primary) VALUES (?, ?, ?, ?)"
          )
          .bind(createdBusinessId, city, serviceArea, index === 0 ? 1 : 0)
      ),
    ];

    await db.batch(relationStatements);

    stage = "services-save";
    for (const service of selectedServices) {
      const categorySlug = categoryForService(service, categories);
      if (!categorySlug) continue;

      const categoryId = categoryIdBySlug.get(categorySlug);
      const slugValue = serviceSlug(categorySlug, service);

      await db
        .prepare("INSERT OR IGNORE INTO services (slug, name, category_id) VALUES (?, ?, ?)")
        .bind(slugValue, service, categoryId)
        .run();

      await db
        .prepare(
          "INSERT OR IGNORE INTO business_services (business_id, service_id) SELECT ?, id FROM services WHERE slug = ?"
        )
        .bind(createdBusinessId, slugValue)
        .run();
    }

    stage = "subscription-save";
    const freePlan = await db
      .prepare("SELECT id FROM plans WHERE code = 'free' AND is_active = 1 LIMIT 1")
      .first();

    if (freePlan?.id) {
      await db
        .prepare(
          "INSERT INTO subscriptions (business_id, plan_id, status, starts_at) VALUES (?, ?, 'active', CURRENT_TIMESTAMP)"
        )
        .bind(createdBusinessId, freePlan.id)
        .run();
    }

    stage = "session-create";
    const session = await createBusinessSession(userId, request);

    return Response.json(
      {
        ok: true,
        business: {
          id: createdBusinessId,
          slug,
          status: "draft",
          verificationStatus: "unverified",
        },
        owner: {
          id: userId,
          phoneVerified: Boolean(existingUser?.phone_verified_at),
        },
        session: { expiresAt: session.expiresAt },
      },
      {
        status: 201,
        headers: {
          "Set-Cookie": session.cookie,
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("business registration failed", error);
    const message = error instanceof Error ? error.message : String(error);

    try {
      if (createdBusinessId) {
        const db = (env as any).DB;
        await db.prepare("DELETE FROM businesses WHERE id = ?").bind(createdBusinessId).run();
      }
    } catch {}

    if (/UNIQUE constraint failed: users\.email/i.test(message)) {
      return Response.json({ ok: false, error: "EMAIL_IN_USE" }, { status: 409 });
    }
    if (/UNIQUE constraint failed: users\.phone/i.test(message)) {
      return Response.json({ ok: false, error: "PHONE_IN_USE" }, { status: 409 });
    }
    if (/no such column:.*password_|no such table: password_reset_tokens/i.test(message)) {
      return Response.json({ ok: false, error: "PASSWORD_SCHEMA_REQUIRED" }, { status: 503 });
    }
    if (/no such table/i.test(message)) {
      return Response.json({ ok: false, error: "DB_SCHEMA_OUTDATED" }, { status: 503 });
    }

    return Response.json(
      { ok: false, error: "INTERNAL_ERROR", stage },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
