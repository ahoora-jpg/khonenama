import { env } from "cloudflare:workers";
import { getBusinessSession } from "@/lib/server/business-session";

function cleanText(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const session = await getBusinessSession(request);
  if (!session?.user_id) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const db = (env as any).DB;

  const business = await db
    .prepare(
      "SELECT b.id, b.slug, b.name, b.description, b.city, b.area, b.address, b.phone, b.website, b.instagram, b.status, b.verification_status, b.is_featured, b.created_at, c.slug AS category_slug, c.name AS category_name FROM businesses b JOIN business_members bm ON bm.business_id = b.id AND bm.user_id = ? AND bm.status = 'active' LEFT JOIN business_categories bc ON bc.business_id = b.id AND bc.is_primary = 1 LEFT JOIN categories c ON c.id = bc.category_id ORDER BY b.id DESC LIMIT 1"
    )
    .bind(session.user_id)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  const [servicesResult, areasResult, planResult, leadCount] = await Promise.all([
    db
      .prepare(
        "SELECT s.id, s.slug, s.name FROM business_services bs JOIN services s ON s.id = bs.service_id WHERE bs.business_id = ? ORDER BY s.id"
      )
      .bind(business.id)
      .all(),
    db
      .prepare(
        "SELECT id, city, area, is_primary FROM business_service_areas WHERE business_id = ? ORDER BY is_primary DESC, id"
      )
      .bind(business.id)
      .all(),
    db
      .prepare(
        "SELECT p.code, p.name, s.status, s.starts_at, s.ends_at FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE s.business_id = ? AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > CURRENT_TIMESTAMP) ORDER BY s.id DESC LIMIT 1"
      )
      .bind(business.id)
      .first(),
    db
      .prepare("SELECT COUNT(*) AS count FROM lead_recipients WHERE business_id = ?")
      .bind(business.id)
      .first(),
  ]);

  const services = servicesResult?.results || [];
  const areas = areasResult?.results || [];

  const completionChecks = [
    Boolean(business.name),
    Boolean(business.description),
    Boolean(business.city),
    Boolean(business.area),
    Boolean(business.address),
    services.length > 0,
    areas.length > 0,
    Boolean(business.phone),
  ];
  const completion = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100
  );

  return Response.json(
    {
      ok: true,
      owner: {
        id: session.user_id,
        fullName: session.full_name || "",
        phone: session.phone || "",
        phoneVerified: Boolean(session.phone_verified_at),
      },
      business: {
        ...business,
        services,
        serviceAreas: areas,
        plan: planResult || null,
        leadCount: Number(leadCount?.count || 0),
        completion,
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(request: Request) {
  const session = await getBusinessSession(request);
  if (!session?.user_id) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const db = (env as any).DB;
  const membership = await db
    .prepare(
      "SELECT b.id FROM businesses b JOIN business_members bm ON bm.business_id = b.id WHERE bm.user_id = ? AND bm.status = 'active' AND bm.role IN ('owner','manager') ORDER BY b.id DESC LIMIT 1"
    )
    .bind(session.user_id)
    .first();

  if (!membership?.id) {
    return Response.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const name = cleanText(body?.name, 180);
  const description = cleanText(body?.description, 2000);
  const city = cleanText(body?.city, 100);
  const area = cleanText(body?.area, 100);
  const address = cleanText(body?.address, 700);
  const website = cleanText(body?.website, 240);
  const instagram = cleanText(body?.instagram, 160);

  if (name.length < 2 || city.length < 2 || description.length < 20) {
    return Response.json({ ok: false, error: "INVALID_PROFILE" }, { status: 400 });
  }

  await db
    .prepare(
      "UPDATE businesses SET name = ?, description = ?, city = ?, area = NULLIF(?, ''), address = NULLIF(?, ''), website = NULLIF(?, ''), instagram = NULLIF(?, ''), updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(name, description, city, area, address, website, instagram, membership.id)
    .run();

  return Response.json({ ok: true });
}
