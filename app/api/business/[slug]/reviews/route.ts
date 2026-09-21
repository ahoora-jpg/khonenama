import { env } from "cloudflare:workers";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

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

function leadIdFromCode(value: string) {
  const normalized = normalizeDigits(value).toUpperCase().replace(/\s/g, "");
  const match = normalized.match(/^KH-?0*(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function ensureReviewSourceSchema(db: any) {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS review_sources (" +
      "review_id INTEGER PRIMARY KEY," +
      "lead_id INTEGER UNIQUE," +
      "business_id INTEGER NOT NULL," +
      "created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP," +
      "FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE," +
      "FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL," +
      "FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE" +
    ")"
  ).run();
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const db = (env as any).DB;
  if (!db) {
    return Response.json({ ok: false, error: "D1_BINDING_NOT_AVAILABLE" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));

  if (clean(body?.website, 160)) {
    return Response.json({ ok: true, status: "pending" });
  }

  const reviewerName = clean(body?.reviewerName, 80);
  const reviewBody = clean(body?.body, 1200);
  const rating = Number(body?.rating);
  const requestCode = clean(body?.requestCode, 40);
  const customerPhone = normalizeIranPhone(clean(body?.customerPhone, 40));

  if (reviewerName.length < 2) {
    return Response.json({ ok: false, error: "INVALID_NAME" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ ok: false, error: "INVALID_RATING" }, { status: 400 });
  }
  if (reviewBody.length < 10) {
    return Response.json({ ok: false, error: "REVIEW_TOO_SHORT" }, { status: 400 });
  }

  const business = await db
    .prepare("SELECT id FROM businesses WHERE slug = ? AND status = 'published' LIMIT 1")
    .bind(slug)
    .first();

  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  await ensureReviewSourceSchema(db);

  let verifiedInteraction = 0;
  let verifiedLeadId: number | null = null;

  if (requestCode) {
    const leadId = leadIdFromCode(requestCode);
    if (!leadId || !/^09\d{9}$/.test(customerPhone)) {
      return Response.json({ ok: false, error: "INVALID_REQUEST_CODE" }, { status: 400 });
    }

    const matched = await db
      .prepare(
        "SELECT l.id FROM leads l JOIN lead_recipients lr ON lr.lead_id = l.id " +
        "WHERE l.id = ? AND lr.business_id = ? AND l.customer_phone = ? LIMIT 1"
      )
      .bind(leadId, business.id, customerPhone)
      .first();

    if (!matched?.id) {
      return Response.json({ ok: false, error: "REQUEST_NOT_MATCHED" }, { status: 403 });
    }

    const used = await db
      .prepare("SELECT review_id FROM review_sources WHERE lead_id = ? LIMIT 1")
      .bind(leadId)
      .first();

    if (used?.review_id) {
      return Response.json({ ok: false, error: "REQUEST_ALREADY_REVIEWED" }, { status: 409 });
    }

    verifiedInteraction = 1;
    verifiedLeadId = leadId;
  } else {
    const recent = await db
      .prepare(
        "SELECT id FROM reviews WHERE business_id = ? AND lower(title) = lower(?) " +
        "AND created_at >= datetime('now','-24 hours') LIMIT 1"
      )
      .bind(business.id, reviewerName)
      .first();

    if (recent?.id) {
      return Response.json({ ok: false, error: "RECENT_DUPLICATE" }, { status: 409 });
    }
  }

  const inserted = await db
    .prepare(
      "INSERT INTO reviews (business_id, rating, title, body, status, verified_interaction) " +
      "VALUES (?, ?, ?, ?, 'pending', ?) RETURNING id"
    )
    .bind(business.id, rating, reviewerName, reviewBody, verifiedInteraction)
    .first();

  const reviewId = Number(inserted?.id);
  if (!reviewId) {
    return Response.json({ ok: false, error: "REVIEW_CREATE_FAILED" }, { status: 500 });
  }

  if (verifiedLeadId) {
    await db
      .prepare("INSERT INTO review_sources (review_id, lead_id, business_id) VALUES (?, ?, ?)")
      .bind(reviewId, verifiedLeadId, business.id)
      .run();
  }

  return Response.json(
    {
      ok: true,
      status: "pending",
      verifiedInteraction: Boolean(verifiedInteraction),
    },
    { status: 201, headers: { "Cache-Control": "no-store" } }
  );
}
