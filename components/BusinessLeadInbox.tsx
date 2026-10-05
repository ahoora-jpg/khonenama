"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, LockKeyhole, MessageCircle, Phone, RefreshCw, Send } from "lucide-react";

import QuoteTermsEditor from '@/components/QuoteTermsEditor';
import { emptyQuoteTerms, type QuoteTerms } from '@/lib/quote-terms';
type LeadRow = { revision?:string;terms?:QuoteTerms;recipient_status?:string;agreed?:{amount:number};
  id: number;
  customer_name: string;
  customer_phone: string;
  request_text: string;
  city: string;
  area?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  status: "open" | "matched" | "closed" | "cancelled";
  created_at: string;
  quote_amount?: number | null;
  quote_message?: string | null;
  quote_status?: string | null;
};

function money(value?: number | null) {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("fa-IR").format(value) + " تومان";
}

function statusLabel(status: LeadRow["status"]) {
  if (status === "matched") return "پیشنهاد ارسال شده";
  if (status === "closed") return "بسته شده";
  if (status === "cancelled") return "لغوشده";
  return "جدید";
}

export default function BusinessLeadInbox() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState<Record<number, { amount: string; message: string; terms: QuoteTerms }>>({});

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/me/business/leads", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) throw new Error("LOAD_FAILED");
      const rows = Array.isArray(result.leads) ? result.leads : [];
      setLeads(rows);
      setDrafts((current) => {
        const next = { ...current };
        for (const row of rows) {
          {
            next[row.id] = {
              amount: row.quote_amount ? String(row.quote_amount) : "",
              message: row.quote_message || "", terms: row.terms || emptyQuoteTerms(),
            };
          }
        }
        return next;
      });
    } catch {
      setMessage("دریافت درخواست‌های مشتری انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openCount = useMemo(
    () => leads.filter((lead) => lead.status === "open").length,
    [leads]
  );

  async function updateStatus(leadId: number, status: LeadRow["status"]) {
    const response = await fetch("/api/me/business/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, action: "status", status }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      setMessage("تغییر وضعیت درخواست انجام نشد.");
      return;
    }
    await load();
  }

  async function sendQuote(leadId: number) {
    const draft = drafts[leadId] || { amount: "", message: "", terms: emptyQuoteTerms() };
    setMessage("");

    const response = await fetch("/api/me/business/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadId,
        action: "quote",
        amount: draft.amount,
        message: draft.message, terms: draft.terms,
        expectedRevision: leads.find(row=>row.id===leadId)?.revision,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      setMessage(result.error==='STALE_QUOTE'?'پیشنهاد تغییر کرده؛ صفحه را تازه کنید.':'ثبت نشد؛ اقلام قیمت و همه شرایط را کامل کنید.');
      return;
    }
    setMessage("پیشنهاد قیمت به‌صورت خصوصی در پرونده درخواست ذخیره شد.");
    await load();
  }

  return (
    <section className="dashboard-panel glass-panel business-lead-inbox" id="leads">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">درخواست‌های مشتری</span>
          <h2>صندوق درخواست قیمت</h2>
        </div>
        <button className="icon-button" type="button" onClick={load} aria-label="به‌روزرسانی">
          <RefreshCw size={17} />
        </button>
      </div>

      <div className="lead-inbox-summary">
        <span><MessageCircle size={15} /> {leads.length} درخواست</span>
        <span><Clock3 size={15} /> {openCount} جدید</span>
        <span><LockKeyhole size={15} /> خصوصی</span>
      </div>

      {message && <div className="business-media-message">{message}</div>}

      {loading ? (
        <div className="dashboard-empty-state">
          <RefreshCw size={22} />
          <strong>در حال دریافت درخواست‌ها...</strong>
        </div>
      ) : leads.length === 0 ? (
        <div className="dashboard-empty-state">
          <MessageCircle size={22} />
          <strong>هنوز درخواستی ثبت نشده</strong>
          <small>وقتی مشتری از صفحه عمومی شما درخواست قیمت بفرستد، فقط در همین بخش نمایش داده می‌شود.</small>
        </div>
      ) : (
        <div className="lead-card-list">
          {leads.map((lead) => {
            const draft = drafts[lead.id] || { amount: "", message: "", terms: emptyQuoteTerms() };
            return (
              <article className={"lead-card status-" + lead.status} key={lead.id}>
                <div className="lead-card-top">
                  <div>
                    <span className="lead-code" dir="ltr">KH-{String(lead.id).padStart(6, "0")}</span>
                    <h3>{lead.customer_name}</h3>
                    <a href={"tel:" + lead.customer_phone}><Phone size={13} /> {lead.customer_phone}</a>
                  </div>
                  <span className="lead-status">{statusLabel((lead.recipient_status || lead.status) as LeadRow["status"])}</span>
                </div>

                <p className="lead-request-text">{lead.request_text}</p>

                <div className="lead-meta">
                  <span>{[lead.city, lead.area].filter(Boolean).join("، ")}</span>
                  {(lead.budget_min || lead.budget_max) && (
                    <span>
                      بودجه: {lead.budget_min ? money(lead.budget_min) : "—"} تا {lead.budget_max ? money(lead.budget_max) : "—"}
                    </span>
                  )}
                </div>

                <div className="lead-private-box">
                  <div className="lead-private-title">
                    <LockKeyhole size={14} />
                    <strong>پیشنهاد خصوصی شما</strong>
                    <small>این مبلغ در صفحه عمومی نمایش داده نمی‌شود.</small>
                  </div>
                  {lead.agreed && <p>مبلغ انتخاب‌شده قبلی: {money(lead.agreed.amount)}؛ تغییر تازه تنها پس از تأیید مشتری جایگزین می‌شود.</p>}
                  <QuoteTermsEditor value={draft.terms} onChange={terms=>setDrafts(current=>({...current,[lead.id]:{...draft,terms}}))}/>
                  <div className="lead-quote-grid">
                    <input
                      dir="ltr"
                      inputMode="numeric"
                      placeholder="مبلغ پیشنهادی (تومان)"
                      value={draft.amount}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [lead.id]: { ...draft, amount: event.target.value },
                        }))
                      }
                    />
                    <textarea
                      rows={3}
                      placeholder="توضیح پیشنهاد، شرایط اجرا، زمان‌بندی یا موارد شامل قیمت"
                      value={draft.message}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [lead.id]: { ...draft, message: event.target.value },
                        }))
                      }
                    />
                    <button className="pill-button dark" type="button" onClick={() => sendQuote(lead.id)}>
                      <Send size={14} /> ذخیره پیشنهاد
                    </button>
                  </div>
                  {lead.quote_status === "sent" && (
                    <small className="lead-quote-saved"><CheckCircle2 size={13} /> پیشنهاد در پرونده خصوصی ذخیره شده است.</small>
                  )}
                </div>

                <div className="lead-status-actions">
                  {(lead.recipient_status || lead.status) !== "closed" && (
                    <button type="button" onClick={() => updateStatus(lead.id, "closed")}>بستن پیگیری این غرفه</button>
                  )}
                  {["closed","cancelled"].includes(lead.recipient_status || lead.status) && (
                    <button type="button" onClick={() => updateStatus(lead.id, "open")}>بازکردن دوباره</button>
                  )}
                  {(lead.recipient_status || lead.status) !== "cancelled" && (
                    <button type="button" onClick={() => updateStatus(lead.id, "cancelled")}>اعلام لغو این غرفه</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
