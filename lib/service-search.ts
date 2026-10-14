import { BUSINESS_CATEGORIES } from "./business-taxonomy";

export function normalizeServiceQuery(value: string) {
  const normalized=value.trim().toLocaleLowerCase("fa").replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[\s\u200c\u200f\u200e\u0640-]+/g,"");
  const aliases:Record<string,string>={minimal:"مینیمال",minimalist:"مینیمال",minimalcurtain:"پردهمینیمال",minimalistcurtain:"پردهمینیمال",wave:"موجدار",ripplefold:"ریپلفولد",verticalblind:"لوردراپه",louverdrape:"لوردراپه","لووردراپه":"لوردراپه","لوردراپه":"لوردراپه"};
  return aliases[normalized]||normalized;
}
export function matchingServiceNames(query: string): string[] {
  const q=normalizeServiceQuery(query);
  if(!q) return [];
  const names=Array.from(new Set(BUSINESS_CATEGORIES.flatMap(category=>category.services)));
  const exact=names.filter(name=>normalizeServiceQuery(name)===q);
  return exact.length?exact:names.filter(name=>normalizeServiceQuery(name).includes(q));
}
export function literalLike(value: string) {
  return value.replace(/\\/g,"\\\\").replace(/%/g,"\\%").replace(/_/g,"\\_");
}
