import { normalizePlanCode, planPresentation } from "./business-entitlements";
export function selectPublicMedia<T extends {id:number;kind:string}>(media:T[], code:unknown,packs=0):T[] {
  const videoLimits: Record<string, number> = {free:0, pro:2, premium:5};
  const videoIds = new Set(media.filter(m=>m.kind === "video").sort((a,b)=>a.id-b.id).slice(0,videoLimits[normalizePlanCode(code)]+(normalizePlanCode(code)==="premium"?packs:0)).map(m=>m.id));
  const limit=planPresentation[normalizePlanCode(code)].galleryLimit+(normalizePlanCode(code)==="premium"?20*packs:0);
  const ids=new Set(media.filter(m=>m.kind!=="cover"&&m.kind!=="logo"&&m.kind!=="video").sort((a,b)=>a.id-b.id).slice(0,limit).map(m=>m.id));
  const special=new Set<string>();
  return media.filter(m=>{if(m.kind==="cover"||m.kind==="logo"){if(special.has(m.kind))return false;special.add(m.kind);return true;}return m.kind === "video" ? videoIds.has(m.id) : ids.has(m.id);});
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
