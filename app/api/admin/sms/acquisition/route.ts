import { env } from "cloudflare:workers";
import { isSmsAdminRequest } from "@/lib/server/sms/admin-auth";
import { TENANT, noStore } from "@/lib/server/sms/domain";
import {
  audienceSql,
  audienceFilter,
  acquisitionReport,
} from "@/lib/server/sms/acquisition-report";
import { crossSiteMutation } from "@/lib/request-security";
import { estimateSms } from "@/lib/sms-text";
import {
  renderCampaignMessage,
  ensureRecipientLink,
} from "@/lib/server/sms/acquisition";
export async function GET(request: Request) {
  if (!(await isSmsAdminRequest(request))) return noStore({ ok: false }, 401);
  const db = (env as any).DB,
    url = new URL(request.url);
  if (url.searchParams.has("timeline")) {
    const messageId = url.searchParams.get("timeline");
    const message = await db
      .prepare(
        "SELECT m.*,c.phone_e164 FROM sms_messages m JOIN sms_contacts c ON c.id=m.contact_id WHERE m.id=? AND m.tenant_id=?",
      )
      .bind(messageId, TENANT)
      .first();
    if (!message) return noStore({ ok: false }, 404);
    const events = await db
      .prepare(
        `SELECT state AS kind,created_at FROM sms_message_events WHERE message_id=? AND tenant_id=? UNION ALL SELECT e.kind,e.created_at FROM sms_link_events e JOIN sms_recipient_links l ON l.id=e.link_id WHERE l.campaign_id=? AND l.contact_id=? AND l.tenant_id=? UNION ALL SELECT cv.kind,cv.created_at FROM sms_acquisition_conversions cv JOIN sms_recipient_links l ON l.id=cv.last_link_id WHERE l.campaign_id=? AND l.contact_id=? AND cv.tenant_id=? ORDER BY created_at`,
      )
      .bind(
        messageId,
        TENANT,
        message.campaign_id,
        message.contact_id,
        TENANT,
        message.campaign_id,
        message.contact_id,
        TENANT,
      )
      .all();
    return noStore({ ok: true, message, events: events.results });
  }
  if (url.searchParams.get("export") === "csv") {
    const { where, params } = audienceFilter(url),
      rows = await db
        .prepare(
          audienceSql +
            ` SELECT phone_e164,display_name,campaign_name,delivery,engagement FROM audience WHERE ${where} ORDER BY created_at DESC LIMIT 10000`,
        )
        .bind(...params)
        .all();
    const cell = (v: unknown) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    await db
      .prepare(
        "INSERT INTO sms_audit_logs(tenant_id,actor,action,detail) VALUES(?,'site_admin','acquisition_export',?)",
      )
      .bind(TENANT, JSON.stringify({ count: rows.results.length }))
      .run();
    return new Response(
      "\uFEFFphone,name,campaign,delivery,engagement\r\n" +
        rows.results
          .map((r: any) =>
            [
              r.phone_e164,
              r.display_name,
              r.campaign_name,
              r.delivery,
              r.engagement,
            ]
              .map(cell)
              .join(","),
          )
          .join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="sms-audience.csv"',
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
  return noStore(await acquisitionReport(db, url));
}
export async function POST(request: Request) {
  if (crossSiteMutation(request)) return noStore({ ok: false }, 403);
  if (!(await isSmsAdminRequest(request))) return noStore({ ok: false }, 401);
  const db = (env as any).DB,
    b = await request.json().catch(() => null);
  if (!b) return noStore({ ok: false }, 400);
  if (b.action === "tracking") {
    if (typeof b.enabled !== "boolean") return noStore({ ok: false }, 400);
    await db
      .prepare(
        "UPDATE sms_acquisition_settings SET tracking_enabled=? WHERE tenant_id=?",
      )
      .bind(b.enabled ? 1 : 0, TENANT)
      .run();
  } else if (b.action === "link") {
    if (typeof b.active !== "boolean") return noStore({ ok: false }, 400);
    await db
      .prepare(
        "UPDATE sms_recipient_links SET active=? WHERE id=? AND tenant_id=?",
      )
      .bind(b.active ? 1 : 0, String(b.id), TENANT)
      .run();
  } else if (b.action === "profile") {
    await db
      .prepare(
        `INSERT INTO sms_contact_profiles(contact_id,city,area,trade) SELECT id,?,?,? FROM sms_contacts WHERE id=? AND tenant_id=? ON CONFLICT(contact_id) DO UPDATE SET city=excluded.city,area=excluded.area,trade=excluded.trade`,
      )
      .bind(
        String(b.city || "").slice(0, 100),
        String(b.area || "").slice(0, 100),
        String(b.trade || "").slice(0, 100),
        String(b.id),
        TENANT,
      )
      .run();
  } else if (b.action === "cost") {
    const cost = Number(b.cost);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1e12)
      return noStore({ ok: false }, 400);
    await db
      .prepare(
        `INSERT INTO sms_campaign_options(campaign_id,actual_cost) SELECT id,? FROM sms_campaigns WHERE id=? AND tenant_id=? ON CONFLICT(campaign_id) DO UPDATE SET actual_cost=excluded.actual_cost`,
      )
      .bind(cost, String(b.id), TENANT)
      .run();
  } else if (b.action === "preview") {
    const campaign = await db
      .prepare("SELECT * FROM sms_campaigns WHERE id=? AND tenant_id=?")
      .bind(String(b.id), TENANT)
      .first();
    const options =
      campaign &&
      (await db
        .prepare("SELECT * FROM sms_campaign_options WHERE campaign_id=?")
        .bind(campaign.id)
        .first());
    if (!campaign) return noStore({ ok: false }, 404);
    const contacts = await db
      .prepare(
        "SELECT c.id,c.phone_e164 FROM sms_contacts c JOIN sms_group_members gm ON gm.contact_id=c.id WHERE gm.group_id=? AND c.tenant_id=? LIMIT 25",
      )
      .bind(campaign.group_id, TENANT)
      .all();
    const rows = [];
    for (const contact of contacts.results) {
      const link = options?.tracking_enabled
        ? await ensureRecipientLink(db, campaign.id, contact.id, options)
        : null;
      const body = renderCampaignMessage(
        link?.variant === "B" ? options.variant_b : campaign.body,
        link?.token,
      );
      rows.push({
        contactId: contact.id,
        phone: contact.phone_e164,
        body,
        ...estimateSms(body),
        estimatedCost:
          options?.tariff == null
            ? null
            : estimateSms(body).parts * options.tariff,
      });
    }
    return noStore({ ok: true, rows });
  } else if (b.action === "saveAudience") {
    const name = String(b.name || "")
      .trim()
      .slice(0, 100);
    if (!name) return noStore({ ok: false }, 400);
    const url = new URL(request.url);
    for (const [k, v] of Object.entries(b.filters || {}))
      if (typeof v === "string") url.searchParams.set(k, v);
    const { where, params } = audienceFilter(url),
      ids = Array.isArray(b.contactIds)
        ? b.contactIds
            .filter((v: unknown) => typeof v === "string")
            .slice(0, 200)
        : [];
    const selected = ids.length
      ? " AND contact_id IN (" + ids.map(() => "?").join(",") + ")"
      : "";
    const members = await db
      .prepare(
        audienceSql +
          ` SELECT DISTINCT contact_id FROM audience WHERE ${where} AND opted_out=0 AND has_booth=0 AND booths=0 ${selected} LIMIT 10000`,
      )
      .bind(...params, ...ids)
      .all();
    const id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO sms_contact_groups(id,tenant_id,name) VALUES(?,?,?)",
      )
      .bind(id, TENANT, name)
      .run();
    for (let i = 0; i < members.results.length; i += 80)
      await db.batch(
        members.results
          .slice(i, i + 80)
          .map((r: any) =>
            db
              .prepare(
                "INSERT OR IGNORE INTO sms_group_members(tenant_id,group_id,contact_id) VALUES(?,?,?)",
              )
              .bind(TENANT, id, r.contact_id),
          ),
      );
    await db
      .prepare(
        "INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(?,'site_admin','audience_saved',?,?)",
      )
      .bind(TENANT, id, JSON.stringify({ count: members.results.length }))
      .run();
    return noStore({ ok: true, id, count: members.results.length });
  } else return noStore({ ok: false, error: "UNKNOWN_ACTION" }, 400);
  await db
    .prepare(
      "INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id) VALUES(?,'site_admin',?,?)",
    )
    .bind(TENANT, "acquisition_" + b.action, String(b.id || TENANT))
    .run();
  return noStore({ ok: true });
}
