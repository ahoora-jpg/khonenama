"use client";

type Props = { services: readonly string[]; selected: string[]; onToggle: (service: string) => void };

// Every original service remains selectable; grouping changes presentation only.
function groupName(service: string) {
  if (/مینیمال/.test(service)) return "پرده مینیمال";
  if (/میل‌پرده|ریل|براکت|سرمیل|درپوش|لغزنده|استاپر|حلقه|گیره|قلاب|نوار|سرب|جمع‌کن|نگهدارنده|زنجیر|مکانیزم|موتور پرده|ریموت پرده|باتری/.test(service)) return "میل‌پرده، یراق و متعلقات";
  if (/پارچه|آستر|والان|حاشیه/.test(service)) return "پارچه و ملزومات";
  if (/نصب|تعمیر|دوخت|اندازه‌گیری|زیرسازی|شست|تعویض|بازکردن|کوتاه|نظافت|بازسازی/.test(service)) return "اجرا و خدمات";
  return "محصولات و تخصص‌ها";
}

export default function ServiceGroupChoices({ services, selected, onToggle }: Props) {
  const groups = new Map<string, string[]>();
  for (const service of services) {
    const key = groupName(service);
    groups.set(key, [...(groups.get(key) || []), service]);
  }
  return <div className="taxonomy-service-groups">
    <p>خدمات اصلی را انتخاب کنید؛ انتخاب مدل‌ها و جزئیات اختیاری است.</p>
    {[...groups].map(([label, items]) => {
      const preferred = label === "میل‌پرده، یراق و متعلقات" ? "میل‌پرده" : label === "پارچه و ملزومات" ? "پارچه پرده" : label === "پرده مینیمال" ? "پرده مینیمال" : "";
      const primary = preferred && items.includes(preferred) ? [preferred] : items.slice(0, 5);
      const details = items.filter(item => !primary.includes(item));
      const choice = (service: string) => <button type="button" key={service} aria-pressed={selected.includes(service)} className={selected.includes(service) ? "choice-chip is-selected taxonomy-service is-active" : "choice-chip taxonomy-service"} onClick={() => onToggle(service)}>{service}</button>;
      return <section key={label} className="glass-panel" style={{padding:"12px",marginBottom:"8px"}}>
        <strong>{label}</strong>
        <div className="choice-grid" style={{marginTop:"8px"}}>{primary.map(choice)}</div>
        {!!details.length && <details style={{marginTop:"8px"}}>
          <summary style={{cursor:"pointer"}}>مدل‌ها و جزئیات بیشتر (اختیاری) · {details.filter(item=>selected.includes(item)).length.toLocaleString("fa-IR")} انتخاب</summary>
          <div className="choice-grid" style={{marginTop:"12px"}}>{details.map(choice)}</div>
        </details>}
      </section>;
    })}
  </div>;
}
