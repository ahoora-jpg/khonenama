import { getOwnedBusiness } from "@/lib/server/business-media";

type HourInput = {
  weekday: number;
  opensAt?: string | null;
  closesAt?: string | null;
  isClosed?: boolean;
};

function validTime(value: unknown) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function GET(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const rows = await owned.db
    .prepare(
      "SELECT weekday, opens_at, closes_at, is_closed FROM business_hours WHERE business_id = ? ORDER BY weekday"
    )
    .bind(owned.business.id)
    .all();

  return Response.json({ ok: true, hours: rows?.results || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const owned = await getOwnedBusiness(request);
  if (!owned) {
    return Response.json({ ok: false, error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const raw: HourInput[] = Array.isArray(body?.hours) ? body.hours : [];
  if (raw.length !== 7) {
    return Response.json({ ok: false, error: "INVALID_HOURS" }, { status: 400 });
  }

  const seen = new Set<number>();
  let normalized: { weekday: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }[];

  try {
    normalized = raw.map((item) => {
      const weekday = Number(item?.weekday);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 || seen.has(weekday)) {
        throw new Error("INVALID_WEEKDAY");
      }
      seen.add(weekday);

      const isClosed = Boolean(item?.isClosed);
      const opensAt = isClosed ? null : item?.opensAt || null;
      const closesAt = isClosed ? null : item?.closesAt || null;

      if (!isClosed && (!validTime(opensAt) || !validTime(closesAt))) {
        throw new Error("INVALID_TIME");
      }
      if (!isClosed && String(opensAt) >= String(closesAt)) {
        throw new Error("INVALID_RANGE");
      }

      return { weekday, isClosed, opensAt: opensAt as string | null, closesAt: closesAt as string | null };
    });

    await owned.db.batch(
      normalized.map((item) =>
        owned.db
          .prepare(
            "INSERT INTO business_hours (business_id, weekday, opens_at, closes_at, is_closed) " +
            "VALUES (?, ?, ?, ?, ?) " +
            "ON CONFLICT(business_id, weekday) DO UPDATE SET opens_at = excluded.opens_at, closes_at = excluded.closes_at, is_closed = excluded.is_closed"
          )
          .bind(
            owned.business.id,
            item.weekday,
            item.opensAt,
            item.closesAt,
            item.isClosed ? 1 : 0
          )
      )
    );
  } catch (error: any) {
    const message = String(error?.message || "");
    if (/INVALID_(WEEKDAY|TIME|RANGE)/.test(message)) {
      return Response.json({ ok: false, error: message }, { status: 400 });
    }
    throw error;
  }

  return Response.json({ ok: true });
}
