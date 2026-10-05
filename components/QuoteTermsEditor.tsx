"use client";
import { quoteFields, handoverExamples, type QuoteTerms } from '@/lib/quote-terms';
export default function QuoteTermsEditor({value,onChange}:{value:QuoteTerms;onChange:(value:QuoteTerms)=>void}) {
  return <fieldset><legend>اقلام قیمت و شرایط اجرا</legend><label>نوع مبلغ<select value={value.kind} onChange={e=>onChange({...value,kind:e.target.value as QuoteTerms['kind']})}><option value="estimate">برآورد اولیه؛ قطعی پس از بازدید</option><option value="final">قیمت قطعی پس از بازدید</option></select></label>{quoteFields.map(([key,label])=><label key={key}>{label}<textarea required rows={2} maxLength={500} value={value[key]} onChange={e=>onChange({...value,[key]:e.target.value})}/></label>)}<details><summary>راهنمای کنترل تحویل متناسب با صنف</summary><p>{handoverExamples}</p></details><small>برای هزینه جدا مبلغ بنویسید، برای اقلام نامرتبط «ندارد». زمان پاسخ اولیه، زمان حضور یا تحویل نیست. تغییر شرایط پس از انتخاب مشتری به تأیید دوباره او نیاز دارد.</small></fieldset>;
}
