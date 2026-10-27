import { TENANT, normalizePhone } from "./domain";
import { estimateSms } from "../../sms-text";
export const LINK_ORIGIN = "https://khonenama.ir";
export const DESTINATIONS = ["/register-business", "/for-business"] as const;
export const validDestination = (value: unknown): value is string =>
  typeof value === "string" &&
  (DESTINATIONS as readonly string[]).includes(value);
export function secureToken() {
  return (
    crypto.randomUUID().replace(/-/g, "") +
    crypto.randomUUID().replace(/-/g, "").slice(0, 8)
  );
}
export function renderCampaignMessage(body: string, token?: string) {
  const rendered = body.replaceAll(
    "{{registration_link}}",
    token ? `${LINK_ORIGIN}/s/${token}` : "",
  );
  if (
    /\{\{[^}]*\}\}/.test(rendered) ||
    (!token && body.includes("{{registration_link}}"))
  )
    throw Error("UNRESOLVED_VARIABLE");
  if (rendered.length > 1600) throw Error("MESSAGE_TOO_LONG");
  return rendered;
}
export async function ensureRecipientLink(
  db: any,
  campaignId: string,
  contactId: string,
  options: any,
) {
  await db
    .prepare(
      `INSERT OR IGNORE INTO sms_recipient_links(id,tenant_id,campaign_id,contact_id,token,destination,expires_at,variant)
 VALUES(?,?,?,?,?,?,?,?)`,
    )
    .bind(
      crypto.randomUUID(),
      TENANT,
      campaignId,
      contactId,
      secureToken(),
      options.destination,
      options.expires_at || null,
      options.variant_b
        ? crypto.getRandomValues(new Uint8Array(1))[0] < 128
          ? "A"
          : "B"
        : "A",
    )
    .run();
  return db
    .prepare(
      "SELECT * FROM sms_recipient_links WHERE campaign_id=? AND contact_id=? AND tenant_id=?",
    )
    .bind(campaignId, contactId, TENANT)
    .first();
}
export async function prepareRecipient(
  db: any,
  campaign: any,
  contactId: string,
  messageId: string,
) {
  const options = await db
    .prepare("SELECT * FROM sms_campaign_options WHERE campaign_id=?")
    .bind(campaign.id)
    .first();
  let text = campaign.body;
  if (options?.tracking_enabled) {
    const link = await ensureRecipientLink(db, campaign.id, contactId, options);
    text = renderCampaignMessage(
      link.variant === "B" ? options.variant_b : campaign.body,
      link.token,
    );
  } else text = renderCampaignMessage(text);
  const parts = estimateSms(text).parts;
  return { text, parts, tariff: options?.tariff ?? null, messageId };
}
function cookie(request: Request, name: string) {
  return (
    (request.headers.get("cookie") || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.slice(name.length + 1) || ""
  );
}
export function attributionSession(request: Request) {
  const id = cookie(request, "kn_sms_visit");
  return /^[a-f0-9]{40}$/.test(id) ? id : null;
}
export function isSuspicious(request: Request) {
  return (
    /bot|crawler|spider|preview|facebookexternalhit|whatsapp|telegram|headless/i.test(
      request.headers.get("user-agent") || "",
    ) ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose")?.includes("prefetch") === true
  );
}
export async function handleAcquisitionLink(
  request: Request,
  db: any,
): Promise<Response> {
  const headers = new Headers({
    Location: LINK_ORIGIN + "/register-business",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
  });
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  const token = new URL(request.url).pathname.slice(3);
  if (!/^[a-f0-9]{40}$/.test(token))
    return new Response("این لینک معتبر نیست.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  try {
    const link = await db
      .prepare(
        `SELECT l.*,s.tracking_enabled FROM sms_recipient_links l JOIN sms_acquisition_settings s ON s.tenant_id=l.tenant_id WHERE l.token=? AND l.tenant_id=?`,
      )
      .bind(token, TENANT)
      .first();
    if (
      !link ||
      !link.active ||
      (link.expires_at && Date.parse(link.expires_at) <= Date.now())
    )
      return new Response(
        "این لینک غیرفعال یا منقضی شده است. برای ساخت غرفه به خونه‌نما مراجعه کنید.",
        { status: 410, headers: { "Cache-Control": "no-store" } },
      );
    headers.set(
      "Location",
      LINK_ORIGIN +
        (validDestination(link.destination)
          ? link.destination
          : "/register-business"),
    );
    if (!link.tracking_enabled || request.method === "HEAD")
      return new Response(null, { status: 302, headers });
    const bucketInput =
      token +
      "|" +
      (request.headers.get("cf-connecting-ip") || "unknown") +
      "|" +
      Math.floor(Date.now() / 60000);
    const bucket = Array.from(
      new Uint8Array(
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(bucketInput),
        ),
      ),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    const rate = await db
      .prepare(
        "INSERT INTO sms_link_rate_buckets(bucket,hits) VALUES(?,1) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits",
      )
      .bind(bucket)
      .first();
    if (Number(rate?.hits) > 30)
      return new Response(null, { status: 302, headers });
    const suspicious = isSuspicious(request),
      session = attributionSession(request) || secureToken();
    // Anonymous session IDs, never IP addresses or user-agent strings, are persisted.
    const statements = [
      db
        .prepare(
          `INSERT INTO sms_click_totals(link_id,total,suspicious,first_click,last_click) VALUES(?,1,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
   ON CONFLICT(link_id) DO UPDATE SET total=MIN(total+1,10000000),suspicious=MIN(suspicious+excluded.suspicious,10000000),last_click=CURRENT_TIMESTAMP`,
        )
        .bind(link.id, suspicious ? 1 : 0),
      db
        .prepare(
          `INSERT OR IGNORE INTO sms_link_events(id,link_id,kind,session_id,suspicious) VALUES(?,?,'click',?,?)`,
        )
        .bind(crypto.randomUUID(), link.id, session, suspicious ? 1 : 0),
    ];
    if (!suspicious)
      statements.push(
        db
          .prepare(
            `INSERT INTO sms_attribution_sessions(id,first_link_id,last_link_id) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET
   first_link_id=CASE WHEN last_clicked_at<datetime('now','-30 days') THEN excluded.first_link_id ELSE first_link_id END,last_link_id=excluded.last_link_id,last_clicked_at=CURRENT_TIMESTAMP`,
          )
          .bind(session, link.id, link.id),
      );
    await db.batch(statements);
    if (!suspicious)
      headers.append(
        "Set-Cookie",
        `kn_sms_visit=${session}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
      );
  } catch {
    console.warn("SMS_LINK_ANALYTICS_UNAVAILABLE");
  }
  return new Response(null, { status: 302, headers });
}
export async function recordAcquisitionStage(
  db: any,
  request: Request,
  kind: "registration_view" | "registration_start" | "booth_start",
) {
  const session = attributionSession(request);
  if (!session || isSuspicious(request)) return;
  await db
    .prepare(
      `INSERT OR IGNORE INTO sms_link_events(id,link_id,kind,session_id)
 SELECT ?,s.last_link_id,?,s.id FROM sms_attribution_sessions s JOIN sms_recipient_links l ON l.id=s.last_link_id
 JOIN sms_acquisition_settings settings ON settings.tenant_id=l.tenant_id
 WHERE s.id=? AND s.last_clicked_at>=datetime('now','-30 days') AND settings.tracking_enabled=1 AND l.active=1
 AND (l.expires_at IS NULL OR julianday(l.expires_at)>julianday('now'))`,
    )
    .bind(crypto.randomUUID(), kind, session)
    .run();
}
export async function recordAcquisitionConversion(
  db: any,
  request: Request,
  input: {
    userId: string;
    businessId: number;
    phone: string;
    newAccount: boolean;
    published: boolean;
    complete: boolean;
  },
) {
  const session = attributionSession(request);
  if (!session) return;
  const attribution = await db
    .prepare(
      `SELECT s.first_link_id,s.last_link_id,c.phone_e164 FROM sms_attribution_sessions s
 JOIN sms_recipient_links l ON l.id=s.last_link_id JOIN sms_contacts c ON c.id=l.contact_id
 JOIN sms_acquisition_settings settings ON settings.tenant_id=l.tenant_id
 WHERE s.id=? AND s.last_clicked_at>=datetime('now','-30 days') AND settings.tracking_enabled=1 AND l.active=1
 AND (l.expires_at IS NULL OR julianday(l.expires_at)>julianday('now')) AND l.tenant_id=?`,
    )
    .bind(session, TENANT)
    .first();
  if (!attribution) return;
  const previousFirst=await db.prepare('SELECT first_link_id FROM sms_acquisition_conversions WHERE tenant_id=? AND user_id=? ORDER BY created_at,id LIMIT 1').bind(TENANT,input.userId).first();
  const kinds = [
    "booth_created",
    ...(input.newAccount ? ["account_created"] : []),
    ...(input.published ? ["booth_published"] : []),
    ...(input.complete ? ["booth_completed"] : []),
  ];
  await db.batch(
    kinds.map((kind) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO sms_acquisition_conversions(id,tenant_id,first_link_id,last_link_id,user_id,business_id,kind,identity_match) VALUES(?,?,?,?,?,?,?,?)`,
        )
        .bind(
          crypto.randomUUID(),
          TENANT,
          previousFirst?.first_link_id||attribution.first_link_id,
          attribution.last_link_id,
          input.userId,
          kind === "account_created" ? null : input.businessId,
          kind,
          normalizePhone(input.phone) === attribution.phone_e164 ? 1 : 0,
        ),
    ),
  );
}
export async function reconcileAcquisition(db: any) {
  // Publication may happen days after registration, with no attribution cookie present.
  await db
    .prepare(
      `INSERT OR IGNORE INTO sms_acquisition_conversions(id,tenant_id,first_link_id,last_link_id,user_id,business_id,kind,identity_match)
 SELECT cv.id||':published',cv.tenant_id,cv.first_link_id,cv.last_link_id,cv.user_id,cv.business_id,'booth_published',cv.identity_match
 FROM sms_acquisition_conversions cv JOIN businesses b ON b.id=cv.business_id AND b.owner_user_id=cv.user_id
 JOIN sms_acquisition_settings s ON s.tenant_id=cv.tenant_id
 WHERE cv.tenant_id=? AND cv.kind='booth_created' AND b.status='published' AND s.tracking_enabled=1`,
    )
    .bind(TENANT)
    .run();
  await db.prepare(`INSERT OR IGNORE INTO sms_acquisition_conversions(id,tenant_id,first_link_id,last_link_id,user_id,business_id,kind,identity_match)
   SELECT id||':completed',tenant_id,first_link_id,last_link_id,user_id,business_id,'booth_completed',identity_match
   FROM sms_acquisition_conversions WHERE tenant_id=? AND kind='booth_published'`).bind(TENANT).run();
  await db
    .prepare(
      "DELETE FROM sms_link_rate_buckets WHERE created_at<datetime('now','-1 day')",
    )
    .run();
  await db
    .prepare(
      "DELETE FROM sms_attribution_sessions WHERE last_clicked_at<datetime('now','-90 days')",
    )
    .run();
  await db
    .prepare(
      "UPDATE sms_link_events SET session_id=id WHERE created_at<datetime('now','-90 days') AND session_id<>id",
    )
    .run();
}
export async function campaignRecipientAllowed(db: any, messageId: string) {
  const row = await db
    .prepare(
      `SELECT o.*,m.contact_id,m.campaign_id FROM sms_messages m JOIN sms_campaign_options o ON o.campaign_id=m.campaign_id WHERE m.id=? AND m.tenant_id=?`,
    )
    .bind(messageId, TENANT)
    .first();
  if (!row) return true;
  if (row.exclude_booth_owners) {
    const owner = await db
      .prepare(
        `SELECT 1 FROM sms_contacts c JOIN users u ON REPLACE(REPLACE(u.phone,'+98','0'),' ','')=REPLACE(c.phone_e164,'+98','0') JOIN businesses b ON b.owner_user_id=u.id WHERE c.id=? AND c.tenant_id=? AND b.status<>'suspended' LIMIT 1`,
      )
      .bind(row.contact_id, TENANT)
      .first();
    if (owner) return false;
  }
  const recent = await db
    .prepare(
      `SELECT 1 FROM sms_messages WHERE tenant_id=? AND contact_id=? AND campaign_id<>? AND category='promotional' AND attempts>0 AND created_at>datetime('now','-'||?||' days') LIMIT 1`,
    )
    .bind(TENANT, row.contact_id, row.campaign_id, row.cooldown_days)
    .first();
  return !recent;
}
