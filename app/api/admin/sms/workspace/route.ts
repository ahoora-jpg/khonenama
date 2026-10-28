import { env } from "cloudflare:workers";
import { isSmsAdminRequest } from "@/lib/server/sms/admin-auth";
import { TENANT, maskPhone, noStore } from "@/lib/server/sms/domain";

const consentSql = `(CASE WHEN EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=c.tenant_id AND o.contact_id=c.id) THEN 'revoked' ELSE 'active' END)`;
export async function GET(request: Request) {
  if (!(await isSmsAdminRequest(request))) return noStore({ ok: false }, 401);
  const db = (env as any).DB;
  if (!db) return noStore({ ok: false, error: "DB_UNAVAILABLE" }, 503);
  const url = new URL(request.url),
    view = url.searchParams.get("view");
  const page =
      Math.max(1, Math.min(100000, Number(url.searchParams.get("page")) || 1)) |
      0,
    size = 20;
  const q = (url.searchParams.get("q") || "").trim().slice(0, 120),
    filter = (url.searchParams.get("filter") || "").slice(0, 40);
  const offset = (page - 1) * size;
  try {
    if (view === "contacts") {
      const values: unknown[] = [TENANT];
      let where = "c.tenant_id=? AND c.source<>'removed'";
      if (q) {
        where += " AND (c.display_name LIKE ? OR c.phone_e164 LIKE ?)";
        values.push("%" + q + "%", "%" + q + "%");
      }
      if (["active", "revoked"].includes(filter)) {
        where += " AND " + consentSql + "=?";
        values.push(filter);
      }
      const [total, rows] = await Promise.all([
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM sms_contacts c WHERE " + where,
          )
          .bind(...values)
          .first(),
        db
          .prepare(
            `SELECT c.id,c.display_name,c.phone_e164,c.kind,c.created_at,${consentSql} AS consent_status FROM sms_contacts c WHERE ${where} ORDER BY c.created_at DESC,c.id LIMIT ? OFFSET ?`,
          )
          .bind(...values, size, offset)
          .all(),
      ]);
      const items = await Promise.all(
        rows.results.map(async (c: any) => {
          const groups = await db
            .prepare(
              "SELECT g.id,g.name FROM sms_group_members gm JOIN sms_contact_groups g ON g.id=gm.group_id AND g.tenant_id=gm.tenant_id WHERE gm.tenant_id=? AND gm.contact_id=?",
            )
            .bind(TENANT, c.id)
            .all();
          return {
            ...c,
            phone_e164: maskPhone(c.phone_e164),
            groups: groups.results,
          };
        }),
      );
      return noStore({ ok: true, items, total: total.count, page, size });
    }
    if (view === "contact") {
      const id = url.searchParams.get("id") || "";
      const contact = await db
        .prepare(
          `SELECT c.id,c.display_name,c.phone_e164,c.kind,c.created_at,${consentSql} AS consent_status FROM sms_contacts c WHERE c.tenant_id=? AND c.id=?`,
        )
        .bind(TENANT, id)
        .first();
      if (!contact) return noStore({ ok: false }, 404);
      const history = await db
        .prepare(
          "SELECT status,method,text_version,evidence_ref,created_at FROM sms_consents WHERE tenant_id=? AND contact_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100",
        )
        .bind(TENANT, id)
        .all();
      return noStore({
        ok: true,
        contact: { ...contact, phone_e164: maskPhone(contact.phone_e164) },
        history: history.results,
      });
    }
    if (view === "history" || view === "inbox") {
      const inbound = view === "inbox",
        values: unknown[] = [TENANT];
      let where = "m.tenant_id=?";
      if (q) {
        where += inbound
          ? " AND (m.sender_e164 LIKE ? OR m.body LIKE ?)"
          : " AND (c.phone_e164 LIKE ? OR m.body LIKE ?)";
        values.push("%" + q + "%", "%" + q + "%");
      }
      const states = [
        "draft",
        "queued",
        "leased",
        "submitted",
        "processed",
        "sent",
        "delivered",
        "failed",
        "unknown",
        "cancelled",
      ];
      if (!inbound && states.includes(filter)) {
        where += " AND m.status=?";
        values.push(filter);
      }
      const from = inbound
        ? "sms_inbound_messages m"
        : "sms_messages m JOIN sms_contacts c ON c.id=m.contact_id AND c.tenant_id=m.tenant_id";
      const columns = inbound
        ? "m.id,m.sender_e164,m.body,m.received_at"
        : "m.id,m.category,m.status,m.body,m.created_at,m.updated_at,m.gateway_message_id,c.phone_e164";
      const total = await db
        .prepare(`SELECT COUNT(*) AS count FROM ${from} WHERE ${where}`)
        .bind(...values)
        .first();
      const rows = await db
        .prepare(
          `SELECT ${columns} FROM ${from} WHERE ${where} ORDER BY ${inbound ? "m.received_at" : "m.created_at"} DESC,m.id LIMIT ? OFFSET ?`,
        )
        .bind(...values, size, offset)
        .all();
      return noStore({
        ok: true,
        items: rows.results.map((m: any) => ({
          ...m,
          ...(inbound
            ? { sender_e164: maskPhone(m.sender_e164) }
            : { phone_e164: maskPhone(m.phone_e164) }),
        })),
        total: total.count,
        page,
        size,
      });
    }
    if (view === "groups") {
      const groups = await db
        .prepare(
          `SELECT g.id,g.name,(SELECT COUNT(*) FROM sms_group_members gm WHERE gm.tenant_id=g.tenant_id AND gm.group_id=g.id) AS member_count,
        (SELECT COUNT(*) FROM sms_group_members gm JOIN sms_contacts c ON c.id=gm.contact_id AND c.tenant_id=gm.tenant_id WHERE gm.tenant_id=g.tenant_id AND gm.group_id=g.id AND ${consentSql}='active') AS eligible_count FROM sms_contact_groups g WHERE g.tenant_id=? ORDER BY g.name LIMIT 500`,
        )
        .bind(TENANT)
        .all();
      const groupId = url.searchParams.get("id");
      let members: any[] = [];
      if (groupId) {
        const rows = await db
          .prepare(
            `SELECT c.id,c.display_name,c.phone_e164,${consentSql} AS consent_status FROM sms_group_members gm JOIN sms_contacts c ON c.id=gm.contact_id AND c.tenant_id=gm.tenant_id WHERE gm.tenant_id=? AND gm.group_id=? ORDER BY c.display_name,c.id LIMIT 50 OFFSET ?`,
          )
          .bind(TENANT, groupId, (page-1)*50)
          .all();
        members = rows.results.map((c: any) => ({
          ...c,
          phone_e164: maskPhone(c.phone_e164),
        }));
      }
      return noStore({
        ok: true,
        groups: groups.results,
        members,
        memberLimit: 50,
      });
    }
    if (view === "reports") {
      const end =
          url.searchParams.get("to") || new Date().toISOString().slice(0, 10),
        start =
          url.searchParams.get("from") ||
          new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
      if (
        ![start, end].every(
          (v) =>
            /^\d{4}-\d\d-\d\d$/.test(v) &&
            Number.isFinite(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v,
        ) ||
        start > end ||
        Date.parse(end) - Date.parse(start) > 366 * 86400000
      )
        return noStore({ ok: false, error: "INVALID_DATE_RANGE" }, 400);
      const [daily, outcomes, categories, consents, optouts] =
        await Promise.all([
          db
            .prepare(
              "SELECT date(created_at) AS day,COUNT(*) AS count FROM sms_messages WHERE tenant_id=? AND date(created_at) BETWEEN ? AND ? GROUP BY date(created_at) ORDER BY day",
            )
            .bind(TENANT, start, end)
            .all(),
          db
            .prepare(
              "SELECT status,COUNT(*) AS count FROM sms_messages WHERE tenant_id=? AND date(created_at) BETWEEN ? AND ? GROUP BY status",
            )
            .bind(TENANT, start, end)
            .all(),
          db
            .prepare(
              "SELECT category,COUNT(*) AS count FROM sms_messages WHERE tenant_id=? AND date(created_at) BETWEEN ? AND ? GROUP BY category",
            )
            .bind(TENANT, start, end)
            .all(),
          db
            .prepare(
              "SELECT status,COUNT(*) AS count FROM sms_consents WHERE tenant_id=? AND date(created_at) BETWEEN ? AND ? GROUP BY status",
            )
            .bind(TENANT, start, end)
            .all(),
          db
            .prepare(
              "SELECT COUNT(*) AS count FROM sms_opt_outs WHERE tenant_id=? AND date(created_at) BETWEEN ? AND ?",
            )
            .bind(TENANT, start, end)
            .first(),
        ]);
      return noStore({
        ok: true,
        from: start,
        to: end,
        daily: daily.results,
        outcomes: outcomes.results,
        categories: categories.results,
        consents: consents.results,
        optouts: optouts.count,
      });
    }
    return noStore({ ok: false, error: "UNKNOWN_VIEW" }, 400);
  } catch {
    return noStore({ ok: false, error: "WORKSPACE_UNAVAILABLE" }, 503);
  }
}
