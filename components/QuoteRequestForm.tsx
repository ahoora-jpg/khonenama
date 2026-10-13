"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LockKeyhole, MessageCircle, Send } from "lucide-react";

import { modelCode, measurement } from "@/lib/model-quote";
import ServiceSearchPicker from "@/components/ServiceSearchPicker";
import { formatMoneyInput, moneyDigits } from "@/lib/money-input";

function track(slug: string, event: string) {
  fetch("/api/business/" + encodeURIComponent(slug) + "/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}

function normalizedPhone(value: string) {
  const digits = value.replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[^\d+]/g, "");
  return digits.replace(/^\+?98/, "0");
}

export default function QuoteRequestForm({
  businessSlug,
  businessName,
  services = [],
  models = [],
  modelNames = [],
}: {
  businessSlug: string;
  businessName: string;
  services?: string[];
  models?: {id:number;url:string;altText:string}[];
  modelNames?: string[];
}) {
  const [selectedModelId,setSelectedModelId] = useState<number | null>(null);
  const [modelName,setModelName] = useState("");
  const [width,setWidth] = useState("");
  const [height,setHeight] = useState("");
  const selectedModel = models.find(item=>item.id===selectedModelId);
  const hasModel = Boolean(selectedModel || modelName.trim());
  useEffect(()=>{const choose=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.businessSlug!==businessSlug)return;const model=models.find(item=>item.id===detail.mediaId);if(model){setSelectedModelId(model.id);setModelName("");setRequestCode("");start();}};window.addEventListener("khonenama-model-selected",choose);return()=>window.removeEventListener("khonenama-model-selected",choose);},[businessSlug,models]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [area, setArea] = useState("");
  const [requestText, setRequestText] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [service, setService] = useState("");
  const started = useRef(false);
  const [draftLoadedFor,setDraftLoadedFor]=useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chosen = params.get("service") || params.get("q") || "";
    let draft:Record<string,unknown>={};
    try{const raw=sessionStorage.getItem("khonenama-quote-draft-"+businessSlug);if(raw&&raw.length<12000){const stored=JSON.parse(raw);if(typeof stored.savedAt==="number"&&Date.now()-stored.savedAt<2*60*60*1000&&stored.values&&typeof stored.values==="object")draft=stored.values;}}catch{}
    const text=(key:string,max:number)=>typeof draft[key]==="string"?(draft[key] as string).slice(0,max):"";
    setCustomerName(text("customerName",120));setCustomerPhone(text("customerPhone",30));setRequestText(text("requestText",5000));setBudgetMin(text("budgetMin",30));setBudgetMax(text("budgetMax",30));
    setService(chosen.slice(0,120)||text("service",120));
    setArea((params.get("location")||text("area",100)).slice(0,100));
    setModelName(text("modelName",100));setWidth(text("width",10));setHeight(text("height",10));
    setSelectedModelId(typeof draft.selectedModelId === "number" && models.some(item=>item.id===draft.selectedModelId) ? draft.selectedModelId : null);
    setDraftLoadedFor(businessSlug);
  }, [businessSlug]);
  useEffect(()=>{
    if(draftLoadedFor!==businessSlug)return;
    try{const key="khonenama-quote-draft-"+businessSlug;if(requestCode){sessionStorage.removeItem(key);return;}sessionStorage.setItem(key,JSON.stringify({savedAt:Date.now(),values:{customerName,customerPhone,area,requestText,budgetMin,budgetMax,service,selectedModelId,modelName,width,height}}));}catch{}
  },[draftLoadedFor,businessSlug,customerName,customerPhone,area,requestText,budgetMin,budgetMax,service,requestCode,selectedModelId,modelName,width,height]);
  function start() {
    if (!started.current) { started.current = true; track(businessSlug, "quote_start"); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if(loading)return;
    setMessage("");
    setRequestCode("");

    if (customerName.trim().length < 2) {
      setMessage("نام را کامل وارد کنید.");
      return;
    }
    if (!/^09\d{9}$/.test(normalizedPhone(customerPhone))) {
      setMessage("شماره همراه معتبر را به صورت 09xxxxxxxxx وارد کنید.");
      return;
    }
    if(hasModel && measurement(width)===null){setMessage("عرض را به متر وارد کنید؛ مثلاً ۳ یا ۳٫۵.");return;}
    if(height.trim() && measurement(height)===null){setMessage("ارتفاع را به متر وارد کنید.");return;}
    if (!hasModel && requestText.trim().length < 10) {
      setMessage("لطفاً کمی بیشتر درباره نیازتان توضیح دهید.");
      return;
    }

    start();
    setLoading(true);
    try {
      const response = await fetch("/api/business/" + encodeURIComponent(businessSlug) + "/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          area,
          requestText: service ? "خدمت: " + service + "\n" + requestText : requestText,
          selectedMediaId: selectedModel?.id,
          modelName: selectedModel ? undefined : modelName.trim(),
          widthMeters: hasModel ? width : undefined,
          heightMeters: hasModel && height.trim() ? height : undefined,
          budgetMin: moneyDigits(budgetMin),
          budgetMax: moneyDigits(budgetMax),
          website,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.ok) {
        const errors: Record<string, string> = {
          INVALID_MODEL: "این عکس دیگر قابل انتخاب نیست؛ مدل دیگری انتخاب کنید.",
          INVALID_MEASUREMENT: "عرض یا ارتفاع واردشده معتبر نیست.",
          INVALID_NAME: "نام را کامل وارد کنید.",
          INVALID_PHONE: "شماره همراه معتبر نیست.",
          REQUEST_TOO_SHORT: "توضیح درخواست خیلی کوتاه است.",
          INVALID_BUDGET: "بازه بودجه واردشده معتبر نیست.",
          RECENT_DUPLICATE: "درخواست شما در چند دقیقه اخیر ثبت شده است؛ برای پاسخ، کد پیگیری قبلی را بررسی کنید.",
          RATE_LIMITED: "تعداد تلاش‌ها زیاد شده است؛ کمی بعد دوباره امتحان کنید. اطلاعات شما حفظ شده است.",
          TOO_MANY_ATTEMPTS: "تعداد تلاش‌ها زیاد شده است؛ ۱۵ دقیقه بعد دوباره امتحان کنید. اطلاعات شما حفظ شده است.",
          BUSINESS_NOT_FOUND: "این کسب‌وکار در حال حاضر درخواست جدید دریافت نمی‌کند.",
        };
        setMessage(errors[result?.error] || "ثبت درخواست انجام نشد. دوباره تلاش کنید.");
        return;
      }

      track(businessSlug, "quote_sent");
      setRequestCode(result.requestCode || "");
      setCustomerName("");
      setCustomerPhone("");
      setArea("");
      setRequestText("");
      setBudgetMin("");
      setBudgetMax("");setSelectedModelId(null);setModelName("");setWidth("");setHeight("");
    } catch {
      setMessage("ارتباط با سرور برقرار نشد. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  if (requestCode) {
    return (
      <div className="quote-success glass-panel">
        <CheckCircle2 size={28} />
        <div>
          <span className="section-kicker">درخواست ثبت شد</span>
          <h3>درخواست شما خصوصی برای {businessName} ارسال شد.</h3>
          <p>کد پیگیری: <strong dir="ltr">{requestCode}</strong></p>
          <small><LockKeyhole size={13} /> اطلاعات درخواست و قیمت پیشنهادی روی صفحه عمومی نمایش داده نمی‌شوند.</small>
          <a
            className="pill-button dark quote-track-link"
            href={"/request-status?code=" + encodeURIComponent(requestCode)}
          >
            پیگیری پاسخ کسب‌وکار
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="quote-request-form glass-panel" onSubmit={submit} onFocusCapture={start}>
      <div className="quote-form-heading">
        <span className="quote-form-icon"><MessageCircle size={20} /></span>
        <div>
          <span className="section-kicker">استعلام خصوصی</span>
          <h3>از {businessName} قیمت بگیر</h3>
          <p>درخواست مستقیماً وارد پنل همین کسب‌وکار می‌شود.</p>
        </div>
      </div>

      <div className="quote-form-grid">
        <div className="quote-wide">
          {selectedModel ? <div className="quote-selected-model"><img src={selectedModel.url} alt={selectedModel.altText || "مدل انتخابی"} width={88} height={88}/><strong>{selectedModel.altText || "مدل انتخابی"} · <span dir="ltr">{modelCode(selectedModel.id)}</span></strong><button type="button" className="pill-button" onClick={()=>setSelectedModelId(null)}>تغییر مدل</button></div> : <label><span>مدل دلخواه</span><input list={"model-names-"+businessSlug} value={modelName} maxLength={100} onChange={e=>setModelName(e.target.value)} placeholder="از فهرست انتخاب کنید یا نام مدل را بنویسید"/><datalist id={"model-names-"+businessSlug}>{modelNames.map(name=><option key={name} value={name}/>)}</datalist></label>}
          {!selectedModel && models.length>0 && <a href="#gallery">یا یک عکس از گالری انتخاب کنید</a>}
        </div>
        {hasModel && <label><span>عرض (متر)</span><input required inputMode="decimal" dir="ltr" maxLength={10} value={width} onChange={e=>setWidth(e.target.value)} placeholder="مثلاً 3.5"/></label>}
        <label><span>نام شما</span><input autoComplete="name" maxLength={120} value={customerName} onChange={e=>setCustomerName(e.target.value)} /></label>
        <label><span>شماره همراه</span><input autoComplete="tel" type="tel" dir="ltr" inputMode="tel" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="09..."/></label>
        <label className="quote-honeypot" aria-hidden="true"><span>وب‌سایت</span><input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label>
        {!hasModel && <label className="quote-wide"><span>چه خدمتی می‌خواهید؟</span><textarea value={requestText} maxLength={1000} onChange={e=>setRequestText(e.target.value)} rows={2} placeholder="نیازتان را کوتاه بنویسید"/></label>}
      </div>
      <details className="quote-extra-fields"><summary>اطلاعات بیشتر (اختیاری)</summary><div className="quote-form-grid">
        {hasModel && <label><span>ارتفاع (متر، اختیاری)</span><input inputMode="decimal" dir="ltr" maxLength={10} value={height} onChange={e=>setHeight(e.target.value)}/></label>}
        {services.length>0 && <div className="quote-wide"><ServiceSearchPicker services={services} value={service} onChange={setService}/></div>}
        <label><span>محله یا محدوده</span><input maxLength={100} value={area} onChange={e=>setArea(e.target.value)}/></label>
        {hasModel && <label className="quote-wide"><span>توضیح کوتاه</span><textarea rows={2} maxLength={800} value={requestText} onChange={e=>setRequestText(e.target.value)}/></label>}
        <label><span>حداقل بودجه</span><div className="money-input"><input aria-label="حداقل بودجه به تومان" dir="ltr" inputMode="numeric" value={budgetMin} onChange={e=>setBudgetMin(formatMoneyInput(e.target.value))}/><span>تومان</span></div></label>
        <label><span>حداکثر بودجه</span><div className="money-input"><input aria-label="حداکثر بودجه به تومان" dir="ltr" inputMode="numeric" value={budgetMax} onChange={e=>setBudgetMax(formatMoneyInput(e.target.value))}/><span>تومان</span></div></label>
      </div></details>

      <div className="quote-privacy-note">
        <LockKeyhole size={15} />
        <span>درخواست و شماره تماس شما خصوصی است.</span>
      </div>

      {message && <div className="quote-form-error" role="alert">{message}</div>}

      <button className="pill-button dark quote-submit" type="submit" disabled={loading}>
        {loading ? "در حال ارسال..." : "ارسال درخواست قیمت"} <Send size={15} />
      </button>
    </form>
  );
}
