import { normalizePlanCode, planPresentation } from "./business-entitlements";
export function selectPublicMedia<T extends {id:number;kind:string}>(media:T[], code:unknown):T[] {
  const limit=planPresentation[normalizePlanCode(code)].galleryLimit;
  const ids=new Set(media.filter(m=>m.kind!=="cover"&&m.kind!=="logo").sort((a,b)=>a.id-b.id).slice(0,limit).map(m=>m.id));
  const special=new Set<string>();
  return media.filter(m=>{if(m.kind==="cover"||m.kind==="logo"){if(special.has(m.kind))return false;special.add(m.kind);return true;}return ids.has(m.id);});
}
export function subscriptionNotice(row:{code:string;status:string;ends_at:string|null}|null,now=Date.now()) {
  const raw=row?.ends_at;const ends=raw?Date.parse(raw.includes("T")?raw:raw.replace(" ","T")+"Z"):NaN;
  const paid=row?.code==="pro"||row?.code==="premium";
  const valid=paid&&row?.status==="active"&&(!raw||ends>now);
  const effectivePlan=valid?normalizePlanCode(row?.code):"free";
  const expired=paid&&Number.isFinite(ends)&&ends<=now;
  const remainingDays=Number.isFinite(ends)?Math.max(0,Math.ceil((ends-now)/86400000)):null;
  const warning=Boolean(expired||(valid&&remainingDays!==null&&remainingDays<=3));
  return {effectivePlan,previousPlan:paid?normalizePlanCode(row?.code):null,endsAt:Number.isFinite(ends)?new Date(ends).toISOString():null,expired,remainingDays,warning,serverNow:new Date(now).toISOString()};
}
