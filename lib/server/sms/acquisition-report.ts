import { TENANT } from "./domain";
// Query-time grouping: recipients are never copied between status tables.
export const audienceSql = `WITH events AS (
 SELECT link_id,COUNT(*) FILTER(WHERE kind='click' AND suspicious=0) AS visitors,
 MAX(kind='registration_start') AS started,MAX(kind='registration_view') AS viewed,
 MIN(CASE WHEN kind='click' AND suspicious=0 THEN created_at END) AS first_click,MAX(CASE WHEN kind='click' AND suspicious=0 THEN created_at END) AS last_click,COUNT(*) FILTER(WHERE kind='click') AS click_sessions
 FROM sms_link_events GROUP BY link_id
), conversions AS (
 SELECT last_link_id AS link_id,COUNT(DISTINCT CASE WHEN kind='account_created' AND identity_match=1 THEN user_id END) AS accounts,
 COUNT(DISTINCT CASE WHEN kind='booth_created' AND identity_match=1 THEN business_id END) AS booths,
 COUNT(DISTINCT CASE WHEN kind='booth_published' AND identity_match=1 THEN business_id END) AS published,
 COUNT(DISTINCT CASE WHEN kind='booth_created' AND identity_match=0 THEN business_id END) AS uncertain_booths,
 MAX(identity_match) AS identity_match FROM sms_acquisition_conversions GROUP BY last_link_id
), first_conversions AS (
 SELECT first_link_id AS link_id,COUNT(DISTINCT CASE WHEN kind='account_created' AND identity_match=1 THEN user_id END) AS first_accounts,
 COUNT(DISTINCT CASE WHEN kind='booth_created' AND identity_match=1 THEN business_id END) AS first_booths FROM sms_acquisition_conversions GROUP BY first_link_id
), audience AS (
 SELECT m.id AS message_id,c.id AS contact_id,c.phone_e164,c.display_name,m.campaign_id,ca.name AS campaign_name,
 m.body,m.status,m.created_at,m.updated_at,p.city,p.area,p.trade,l.id AS link_id,l.token,l.active,l.expires_at,l.variant,
 COALESCE(t.total,0) AS clicks,COALESCE(t.suspicious,0) AS suspicious_clicks,COALESCE(e.visitors,0) AS visitors,
 COALESCE(e.started,0) AS started,COALESCE(e.viewed,0) AS viewed,e.first_click,e.last_click,
 COALESCE(cv.accounts,0) AS accounts,COALESCE(cv.booths,0) AS booths,COALESCE(cv.published,0) AS published,COALESCE(cv.uncertain_booths,0) AS uncertain_booths,
 MAX(0,COALESCE(t.total,0)-COALESCE(e.click_sessions,0)) AS repeated_clicks,
 COALESCE(fc.first_accounts,0) AS first_accounts,COALESCE(fc.first_booths,0) AS first_booths,COALESCE(cv.identity_match,0) AS identity_match,
 (SELECT COUNT(*) FROM sms_messages old WHERE old.contact_id=c.id AND old.tenant_id=c.tenant_id AND old.attempts>0) AS previous_messages,
 (SELECT MAX(old.updated_at) FROM sms_messages old WHERE old.contact_id=c.id AND old.tenant_id=c.tenant_id AND old.category='promotional' AND old.attempts>0) AS last_contact,
 EXISTS(SELECT 1 FROM sms_opt_outs o WHERE o.tenant_id=c.tenant_id AND o.contact_id=c.id) AS opted_out,
 EXISTS(SELECT 1 FROM users u JOIN businesses b ON b.owner_user_id=u.id WHERE REPLACE(REPLACE(u.phone,'+98','0'),' ','')=REPLACE(c.phone_e164,'+98','0') AND b.status<>'suspended') AS has_booth,
 costs.parts,costs.estimated_cost,opts.actual_cost,opts.tariff,
 CASE WHEN m.status='delivered' THEN 'delivered' WHEN m.status='failed' THEN 'failed' WHEN m.status IN('draft','queued','leased','cancelled') THEN m.status ELSE 'unknown' END AS delivery,
 CASE WHEN l.id IS NULL THEN 'untracked' WHEN COALESCE(cv.published,0)>0 THEN 'published' WHEN COALESCE(cv.booths,0)>0 THEN 'booth' WHEN COALESCE(cv.accounts,0)>0 THEN 'registered' WHEN COALESCE(e.started,0)>0 THEN 'incomplete' WHEN COALESCE(e.visitors,0)>0 THEN 'clicked' ELSE 'no_click' END AS engagement
 FROM sms_messages m JOIN sms_contacts c ON c.id=m.contact_id AND c.tenant_id=m.tenant_id
 JOIN sms_campaigns ca ON ca.id=m.campaign_id AND ca.tenant_id=m.tenant_id
 LEFT JOIN sms_contact_profiles p ON p.contact_id=c.id
 LEFT JOIN sms_recipient_links l ON l.campaign_id=m.campaign_id AND l.contact_id=c.id
 LEFT JOIN events e ON e.link_id=l.id LEFT JOIN sms_click_totals t ON t.link_id=l.id
 LEFT JOIN conversions cv ON cv.link_id=l.id LEFT JOIN first_conversions fc ON fc.link_id=l.id
 LEFT JOIN sms_message_costs costs ON costs.message_id=m.id LEFT JOIN sms_campaign_options opts ON opts.campaign_id=m.campaign_id
 WHERE m.tenant_id=? AND c.source<>'removed' AND NOT EXISTS(SELECT 1 FROM sms_removed_records r WHERE r.tenant_id=m.tenant_id AND r.kind='campaign' AND r.record_id=m.campaign_id)
)`;
export const segmentConditions: Record<string, string> = {
  all: "1=1",
  sent: "status IN('sent','delivered')",
  delivered: "delivery='delivered'",
  any_click: "visitors>0",
  new_account: "accounts>0",
  published: "published>0",
  unregistered: "has_booth=0 AND booths=0",
  converted: "booths>0",
  delivered_booth: "delivery='delivered' AND booths>0 AND identity_match=1",
  delivered_no_booth: "delivery='delivered' AND booths=0 AND has_booth=0",
  no_click: "delivery='delivered' AND link_id IS NOT NULL AND visitors=0 AND booths=0 AND has_booth=0",
  clicked:
    "delivery='delivered' AND visitors>0 AND started=0 AND accounts=0 AND booths=0 AND has_booth=0",
  incomplete: "started>0 AND accounts=0 AND booths=0 AND has_booth=0",
  registered: "accounts>0 AND booths=0 AND has_booth=0",
  failed: "delivery='failed'",
  unknown: "delivery='unknown'",
  opted_out: "opted_out=1",
};
export function audienceFilter(url: URL) {
  const parts = [
      segmentConditions[url.searchParams.get("segment") || "all"] || "1=1",
    ],
    params: unknown[] = [TENANT];
  for (const key of [
    "campaign_id",
    "city",
    "area",
    "trade",
    "delivery",
    "engagement",
  ]) {
    const value = url.searchParams.get(key);
    if (value) {
      parts.push(`${key}=?`);
      params.push(value.slice(0, 120));
    }
  }
  for (const [param, op] of [
    ["from", ">="],
    ["to", "<="],
  ] as const) {
    const value = url.searchParams.get(param);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      parts.push(`date(created_at)${op}?`);
      params.push(value);
    }
  }
  const q = url.searchParams.get("q");
  if (q) {
    parts.push("(phone_e164 LIKE ? OR display_name LIKE ?)");
    params.push("%" + q.slice(0, 80) + "%", "%" + q.slice(0, 80) + "%");
  }
  for (const [param, op] of [
    ["last_from", ">="],
    ["last_to", "<="],
  ] as const) {
    const value = url.searchParams.get(param);
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      parts.push(`date(last_contact)${op}?`);
      params.push(value);
    }
  }
  if (url.searchParams.get("latest") === "1")
    parts.push(
      "message_id=(SELECT latest.id FROM sms_messages latest WHERE latest.contact_id=audience.contact_id AND latest.tenant_id='khonenama' AND latest.campaign_id IS NOT NULL ORDER BY latest.created_at DESC,latest.id DESC LIMIT 1)",
    );
  const min = Number(url.searchParams.get("min_messages"));
  if (Number.isSafeInteger(min) && min > 0) {
    parts.push("previous_messages>=?");
    params.push(min);
  }
  return { where: parts.join(" AND "), params };
}
export async function acquisitionReport(db: any, url: URL) {
  const { where, params } = audienceFilter(url),
    page = Math.floor(
      Math.max(1, Math.min(10000, Number(url.searchParams.get("page")) || 1)),
    );
  const order: Record<string, string> = {
    date: "created_at DESC",
    phone: "phone_e164",
    clicks: "clicks DESC",
    messages: "previous_messages DESC",
  };
  const sort = order[url.searchParams.get("sort") || "date"] || order.date;
  const [
    rows,
    summary,
    daily,
    compare,
    variants,
    trades,
    cities,
    settings,
    campaigns,
  ] = await Promise.all([
    db
      .prepare(
        audienceSql +
          ` SELECT * FROM audience WHERE ${where} ORDER BY ${sort},message_id LIMIT 25 OFFSET ?`,
      )
      .bind(...params, (page - 1) * 25)
      .all(),
    db
      .prepare(
        audienceSql +
          ` SELECT COUNT(*) AS total,COUNT(link_id) AS tracked_count,COUNT(DISTINCT contact_id) AS recipients,
 SUM(status IN('sent','delivered')) AS sent,SUM(delivery='delivered') AS delivered,SUM(delivery='failed') AS failed,SUM(delivery='unknown') AS unknown,
 SUM(visitors>0) AS clicked,SUM(clicks) AS clicks,SUM(visitors) AS visitors,SUM(repeated_clicks) AS repeated_clicks,SUM(uncertain_booths) AS uncertain_booths,SUM(suspicious_clicks) AS suspicious_clicks,SUM(started>0) AS started,SUM(accounts) AS accounts,SUM(booths) AS booths,SUM(published) AS published,
 SUM(first_accounts) AS first_accounts,SUM(first_booths) AS first_booths,
 SUM(delivery='delivered' AND link_id IS NOT NULL AND visitors=0 AND booths=0) AS no_click,SUM(visitors>0 AND started=0 AND booths=0) AS clicked_not_started,
 SUM(started>0 AND accounts=0 AND booths=0) AS incomplete,SUM(accounts>0 AND booths=0) AS registered_no_booth,
 SUM(delivery='delivered' AND booths>0 AND identity_match=1) AS delivered_booth,SUM(delivery='delivered' AND booths=0) AS delivered_no_booth,
 COUNT(DISTINCT CASE WHEN opted_out=1 THEN contact_id END) AS opted_out,SUM(estimated_cost) AS estimated_cost,SUM(estimated_cost IS NULL) AS missing_cost,
 COUNT(DISTINCT CASE WHEN booths>0 THEN contact_id END) AS converted_recipients FROM audience WHERE ${where}`,
      )
      .bind(...params)
      .first(),
    db
      .prepare(
        audienceSql +
          `, selected AS (SELECT * FROM audience WHERE ${where}), activity AS (
 SELECT date(MIN(e.created_at)) AS day,'messages' AS kind, e.message_id AS id FROM sms_message_events e JOIN selected a ON a.message_id=e.message_id WHERE e.state IN('sent','delivered') GROUP BY e.message_id
 UNION ALL SELECT date(MIN(e.created_at)),'delivered',e.message_id FROM sms_message_events e JOIN selected a ON a.message_id=e.message_id WHERE e.state='delivered' GROUP BY e.message_id
 UNION ALL SELECT date(e.created_at),'clicks',e.id FROM sms_link_events e WHERE e.kind='click' AND e.suspicious=0 AND e.link_id IN(SELECT link_id FROM selected)
 UNION ALL SELECT date(cv.created_at),CASE WHEN cv.kind='account_created' THEN 'accounts' ELSE 'booths' END,cv.id FROM sms_acquisition_conversions cv WHERE cv.kind IN('account_created','booth_created') AND cv.identity_match=1 AND cv.last_link_id IN(SELECT link_id FROM selected)
 ) SELECT day,SUM(kind='messages') AS messages,SUM(kind='delivered') AS delivered,SUM(kind='clicks') AS clicks,SUM(kind='accounts') AS accounts,SUM(kind='booths') AS booths FROM activity GROUP BY day ORDER BY day DESC LIMIT 30`,
      )
      .bind(...params)
      .all(),
    ...["campaign_name", "variant", "trade", "city"].map((column) =>
      db
        .prepare(
          audienceSql +
            ` SELECT ${column} AS name,COUNT(*) AS messages,SUM(visitors>0) AS clicked,SUM(accounts) AS accounts,SUM(booths) AS booths,CASE WHEN SUM(estimated_cost IS NULL)>0 THEN NULL ELSE SUM(estimated_cost) END AS estimated_cost FROM audience WHERE ${where} GROUP BY ${column} ORDER BY messages DESC LIMIT 50`,
        )
        .bind(...params)
        .all(),
    ),
    db
      .prepare(
        "SELECT tracking_enabled FROM sms_acquisition_settings WHERE tenant_id=?",
      )
      .bind(TENANT)
      .first(),
    db
      .prepare(
        "SELECT id,name FROM sms_campaigns WHERE tenant_id=? AND NOT EXISTS(SELECT 1 FROM sms_removed_records r WHERE r.tenant_id=sms_campaigns.tenant_id AND r.kind='campaign' AND r.record_id=sms_campaigns.id) ORDER BY created_at DESC LIMIT 100",
      )
      .bind(TENANT)
      .all(),
  ]);
  const actual = await db
    .prepare(
      audienceSql +
        ` SELECT SUM(o.actual_cost) AS actual_cost,SUM(o.actual_cost IS NULL) AS missing_actual FROM (SELECT DISTINCT campaign_id FROM audience WHERE ${where}) a LEFT JOIN sms_campaign_options o ON o.campaign_id=a.campaign_id`,
    )
    .bind(...params)
    .first();
  summary.actual_cost = actual?.actual_cost ?? null;
  summary.missing_actual = actual?.missing_actual ?? null;
  summary.actual_cost_comparable = !Array.from(url.searchParams.keys()).some(
    (key) =>
      !["campaign_id", "page", "sort"].includes(key) &&
      url.searchParams.get(key) &&
      !(key === "segment" && url.searchParams.get(key) === "all"),
  )
    ? 1
    : 0;
  const uniqueVisitors = await db
    .prepare(
      audienceSql +
        ` SELECT COUNT(DISTINCT e.session_id) AS n FROM sms_link_events e WHERE e.kind='click' AND e.suspicious=0 AND e.link_id IN(SELECT link_id FROM audience WHERE ${where})`,
    )
    .bind(...params)
    .first();
  summary.visitors =
    Number(summary.total) > 0 ? Number(uniqueVisitors?.n || 0) : null;
  if(!summary.tracked_count)for(const key of ['clicked','clicks','visitors','repeated_clicks','uncertain_booths','suspicious_clicks','started','accounts','booths','published','first_accounts','first_booths','no_click','clicked_not_started','incomplete','registered_no_booth','delivered_booth','converted_recipients'])summary[key]=null;
  return {
    ok: true,
    rows: rows.results,
    summary,
    daily: daily.results,
    compare: compare.results,
    variants: variants.results,
    trades: trades.results,
    cities: cities.results,
    settings,
    campaigns: campaigns.results,
    page,
  };
}
