import { env } from "cloudflare:workers";
import { createBusinessSession } from "@/lib/server/business-session";

const allowedServices: Record<string, readonly string[]> = {
  curtain: ["پرده زبرا", "پرده شید", "پرده پارچه‌ای", "اندازه‌گیری", "دوخت", "نصب"],
  flooring: ["پارکت", "لمینت", "PVC", "قرنیز", "زیرسازی", "نصب"],
  carpet: ["موکت رول", "موکت تایلی", "اندازه‌گیری", "نصب"],
  wallpaper: ["کاغذ دیواری", "پوستر دیواری", "دیوارپوش", "زیرسازی", "نصب"],
  "interior-design": ["طراحی داخلی", "طراحی سه‌بعدی", "انتخاب متریال", "نظارت", "اجرا"],
};

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

function serviceSlug(category: string, index: number) {
  return category + "-" + String(index + 1).padStart(2, "0");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerName = cleanText(body?.ownerName, 120);
    const phone = normalizeIranPhone(cleanText(body?.phone, 32));
    const email = cleanText(body?.email, 160).toLowerCase();
    const businessName = cleanText(body?.businessName, 180);
    const category = cleanText(body?.category, 80);
    const city = cleanText(body?.city, 100);
    const area = cleanText(body?.area, 100);
    const address = cleanText(body?.address, 700);
    const instagram = cleanText(body?.instagram, 160);
    const website = cleanText(body?.website, 240);
    const description = cleanText(body?.description, 2000);
    const requestedServices: string[] = Array.isArray(body?.services) ? body.services.map((item: unknown) => cleanText(item, 100)) : [];
    const requestedAreas: string[] = Array.isArray(body?.serviceAreas) ? body.serviceAreas.map((item: unknown) => cleanText(item, 100)) : [];

    if (ownerName.length < 2 || businessName.length < 2 || city.length < 2) {
      return Response.json({ ok: false, error: "INVALID_REQUIRED_FIELDS" }, { status: 400 });
    }

    if (!/^09\d{9}$/.test(phone)) {
      return Response.json({ ok: false, error: "INVALID_PHONE" }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, error: "INVALID_EMAIL" }, { status: 400 });
    }

    const serviceCatalog = allowedServices[category];
    if (!serviceCatalog) {
      return Response.json({ ok: false, error: "INVALID_CATEGORY" }, { status: 400 });
    }

    const selectedServices: string[] = [...new Set<string>(requestedServices.filter((item) => serviceCatalog.includes(item)))];
    const selectedAreas: string[] = [...new Set<string>(requestedAreas.filter((item) => item.length > 0))].slice(0, 20);

    if (!selectedServices.length || !selectedAreas.length || description.length < 20) {
      return Response.json({ ok: false, error: "INCOMPLETE_PROFILE" }, { status: 400 });
    }

    const db = (env as any).DB;
    if (!db) {
      return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
    }

    const categoryRow = await db
      .prepare("SELECT id FROM categories WHERE slug = ? AND is_active = 1 LIMIT 1")
      .bind(category)
      .first();

    if (!categoryRow?.id) {
      return Response.json({ ok: false, error: "CATEGORY_NOT_FOUND" }, { status: 409 });
    }

    const existingUser = await db.prepare("SELECT id FROM users WHERE phone = ? LIMIT 1").bind(phone).first();
    let userId = existingUser?.id as string | undefined;

    if (!userId) {
      userId = "usr_" + crypto.randomUUID();
      await db
        .prepare("INSERT INTO users (id, phone, email, full_name, status) VALUES (?, ?, NULLIF(?, ''), ?, 'active')")
        .bind(userId, phone, email, ownerName)
        .run();
    } else {
      await db
        .prepare("UPDATE users SET full_name = ?, email = COALESCE(NULLIF(?, ''), email), updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(ownerName, email, userId)
        .run();
    }

    const slug = "business-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    const business = await db
      .prepare(
        "INSERT INTO businesses (slug, name, description, city, area, address, phone, website, instagram, status, verification_status, owner_user_id) VALUES (?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, NULLIF(?, ''), NULLIF(?, ''), 'draft', 'unverified', ?) RETURNING id"
      )
      .bind(slug, businessName, description, city, area, address, phone, website, instagram, userId)
      .first();

    const businessId = Number(business?.id);
    if (!businessId) {
      return Response.json({ ok: false, error: "BUSINESS_CREATE_FAILED" }, { status: 500 });
    }

    const statements = [
      db
        .prepare("INSERT OR IGNORE INTO business_members (business_id, user_id, role, status, joined_at) VALUES (?, ?, 'owner', 'active', CURRENT_TIMESTAMP)")
        .bind(businessId, userId),
      db
        .prepare("INSERT OR IGNORE INTO business_categories (business_id, category_id, is_primary) VALUES (?, ?, 1)")
        .bind(businessId, categoryRow.id),
      ...selectedAreas.map((serviceArea: string, index: number) =>
        db
          .prepare("INSERT INTO business_service_areas (business_id, city, area, is_primary) VALUES (?, ?, ?, ?)")
          .bind(businessId, city, serviceArea, index === 0 ? 1 : 0)
      ),
    ];

    await db.batch(statements);

    for (const service of selectedServices) {
      const index = serviceCatalog.indexOf(service);
      const slugValue = serviceSlug(category, index);
      await db
        .prepare("INSERT OR IGNORE INTO services (slug, name, category_id) VALUES (?, ?, ?)")
        .bind(slugValue, service, categoryRow.id)
        .run();

      const serviceRow = await db.prepare("SELECT id FROM services WHERE slug = ? LIMIT 1").bind(slugValue).first();
      if (serviceRow?.id) {
        await db
          .prepare("INSERT OR IGNORE INTO business_services (business_id, service_id) VALUES (?, ?)")
          .bind(businessId, serviceRow.id)
          .run();
      }
    }

    const freePlan = await db.prepare("SELECT id FROM plans WHERE code = 'free' AND is_active = 1 LIMIT 1").first();
    if (freePlan?.id) {
      await db
        .prepare("INSERT INTO subscriptions (business_id, plan_id, status, starts_at) VALUES (?, ?, 'active', CURRENT_TIMESTAMP)")
        .bind(businessId, freePlan.id)
        .run();
    }

    let session: { cookie: string; expiresAt: string } | null = null;
    try {
      session = await createBusinessSession(userId, request);
    } catch (sessionError) {
      console.warn("business session not available yet", sessionError);
    }

    return Response.json(
      {
        ok: true,
        business: {
          id: businessId,
          slug,
          status: "draft",
          verificationStatus: "unverified",
        },
        owner: {
          id: userId,
          phoneVerified: false,
        },
        session: session ? { expiresAt: session.expiresAt } : null,
      },
      {
        status: 201,
        headers: session
          ? { "Set-Cookie": session.cookie, "Cache-Control": "no-store" }
          : { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("business registration failed", error);
    return Response.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
