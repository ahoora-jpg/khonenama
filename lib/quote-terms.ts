export const quoteFields = [
  ['service','خدمت و دامنه کار'], ['unit','واحد محاسبه'], ['quantity','مقدار و ابعاد'],
  ['materials','نوع و مشخصات متریال'], ['materialCost','هزینه متریال (تومان)'],
  ['laborCost','اجرت (تومان)'], ['extras','هزینه‌های جانبی و اقلام جدا از مبلغ'],
  ['included','اقلام داخل مبلغ؛ زیرسازی، چسب، یراق، حمل، جمع‌آوری و نظافت'],
  ['excluded','اقلام خارج از مبلغ؛ مواردی که انجام نمی‌شوند را نیز بنویسید'],
  ['visit','زمان بازدید یا «هنوز توافق نشده»'], ['start','زمان شروع یا «هنوز توافق نشده»'],
  ['delivery','زمان تحویل یا «هنوز توافق نشده»'], ['handover','معیار تحویل و کنترل کیفیت'],
  ['warranty','صادرکننده، مدت، پوشش و استثناهای ضمانت؛ یا «بدون ضمانت»'],
] as const;
export type QuoteTerms = { kind: 'estimate' | 'final' } & Record<typeof quoteFields[number][0], string>;
export const handoverExamples = 'پرده: اندازه، حرکت و عملکرد؛ کفپوش: سطح و اتصالات؛ دیوارپوش: درز و چسبندگی؛ موکت: برش، درز و تمیزی؛ طراحی داخلی: تطابق طرح و متریال؛ خانه هوشمند: عملکرد، تحویل دسترسی امن و امکان لغو دسترسی مجری. معیارهای مرتبط با همین کار را در پیشنهاد بنویسید.';
export function emptyQuoteTerms(): QuoteTerms {
  return Object.fromEntries([['kind','estimate'], ...quoteFields.map(([key])=>[key,''])]) as QuoteTerms;
}
export function validateQuoteTerms(value: unknown): QuoteTerms | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  if (!['estimate','final'].includes(String(input.kind))) return null;
  const output = { kind: input.kind } as QuoteTerms;
  for (const [key] of quoteFields) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > 500) return null;
    output[key] = input[key].trim();
  }
  return output;
}
export function quoteTermsText(value?: QuoteTerms | null) {
  if (!value) return 'جزئیات این پیشنهاد قدیمی ثبت نشده؛ پیش از انتخاب، جزئیات را از مجری بخواهید.';
  return [(value.kind === 'final' ? 'قیمت قطعی پس از بازدید' : 'برآورد اولیه؛ قیمت قطعی پس از بازدید'), ...quoteFields.map(([key,label])=>label+': '+value[key])].join('\n');
}
