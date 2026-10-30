export type SmsEventType = 'click' | 'stage' | 'conversion' | 'bridge_report' | 'bridge_inbound' | 'access_state' | 'site_sync';
export type SmsEvent = {version:1;id:string;type:SmsEventType;requestId:string;occurredAt:string;payload:Record<string,any>};
export type SmsEventQueue = {send(event:unknown):Promise<unknown>};
const eventTypes = new Set(['click','stage','conversion','bridge_report','bridge_inbound','access_state','site_sync']);
const recentAcceptances=new WeakMap<object,Map<string,{hash:string;expires:number}>>();
export class SmsEventError extends Error {
  constructor(public code:string,public transient=true){super(code);}
}
export function smsFailure(error:unknown){
  if(error instanceof SmsEventError)return {code:error.code,transient:error.transient};
  const text=String((error as any)?.message||error);
  if(/daily.*limit|exceeded D1|quota/i.test(text))return {code:'D1_QUOTA',transient:true};
  if(/no such table|no such column/i.test(text))return {code:'SCHEMA_NOT_READY',transient:true};
  if(/SQLITE_BUSY|overloaded|locked|too many|rate.limit/i.test(text))return {code:'D1_BUSY',transient:true};
  if(/timeout|timed out|AbortError/i.test(text))return {code:'DEPENDENCY_TIMEOUT',transient:true};
  if(/constraint|SQLITE_CONSTRAINT/i.test(text))return {code:'DATA_CONSTRAINT',transient:false};
  if(/D1_ERROR|database|SQLITE|network|fetch failed|offline|temporarily|unavailable|ECONN|ETIMEDOUT/i.test(text))return {code:'DEPENDENCY_UNAVAILABLE',transient:true};
  return {code:'INTERNAL_ERROR',transient:false};
}
export function smsLog(result:string,input:{requestId:string;eventType?:string;eventId?:string;messageId?:string;businessId?:string|number;attempt?:number;reason?:string;durationMs?:number}){
  // Deliberately allow-list fields. Never log payloads, URLs, phone numbers, credentials or raw exceptions.
  const id=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9:_-]{1,128}$/.test(v)&&!/^\+?\d{7,15}$/.test(v)&&!(/^[a-f0-9]{40}$/i.test(v))?v:undefined;
  console.log(JSON.stringify({component:'sms',path:input.eventType==='click'?'/s/:token':['stage','conversion'].includes(input.eventType||'')?'/register-business':input.eventType==='access_state'?'/access-state':'/api/v1/sms/bridge',result,requestId:id(input.requestId),eventType:id(input.eventType),eventId:id(input.eventId),messageId:id(input.messageId),businessId:typeof input.businessId==='number'?input.businessId:undefined,attempt:input.attempt,reason:id(input.reason),durationMs:input.durationMs}));
}
export function smsRequestId(request:Request){
  const candidate=request.headers.get('x-request-id')||request.headers.get('cf-ray')||'';
  return /^[a-zA-Z0-9:_-]{1,100}$/.test(candidate)&&!/^\+?\d{7,15}$/.test(candidate)&&!(/^[a-f0-9]{40}$/i.test(candidate))?candidate:crypto.randomUUID();
}
function canonical(value:any):string {
  if(value===null||typeof value!=='object')return JSON.stringify(value)??'null';
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
}
export async function eventHash(value:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(value)))),b=>b.toString(16).padStart(2,'0')).join('');}
export function smsEventPayload(event:SmsEvent){const payload={...event.payload};delete payload.validatedAtAccept;return {type:event.type,payload};}
export async function makeSmsEvent(type:SmsEventType,payload:Record<string,any>,requestId:string,key?:string):Promise<SmsEvent>{
  const id=type+':'+await eventHash(key?{key}:{payload});
  return {version:1,id,type,payload,requestId,occurredAt:new Date().toISOString()};
}
export function validSmsEvent(event:any):event is SmsEvent {
  return event?.version===1&&eventTypes.has(event.type)&&typeof event.id==='string'&&/^[a-z_]+:[a-f0-9]{64}$/.test(event.id)&&typeof event.requestId==='string'&&/^[a-zA-Z0-9:_-]{1,128}$/.test(event.requestId)&&Number.isFinite(Date.parse(event.occurredAt))&&Date.parse(event.occurredAt)<=Date.now()+300000&&event.payload&&typeof event.payload==='object'&&new TextEncoder().encode(JSON.stringify(event)).length<=60000;
}
export async function acceptSmsEvent(queue:SmsEventQueue,event:SmsEvent){
  if(!validSmsEvent(event))throw new SmsEventError('INVALID_EVENT',false);
  const hash=await eventHash(smsEventPayload(event));let recent=recentAcceptances.get(queue as object);
  if(!recent){recent=new Map();recentAcceptances.set(queue as object,recent);}
  const existing=recent.get(event.id);
  if(existing&&existing.expires>Date.now()){if(existing.hash!==hash)throw new SmsEventError('IDEMPOTENCY_CONFLICT',false);return event.id;}
  await queue.send(event); // An acknowledgement is returned only after durable acceptance.
  recent.set(event.id,{hash,expires:Date.now()+30000});if(recent.size>512)recent.delete(recent.keys().next().value!);
  smsLog('accepted',{requestId:event.requestId,eventType:event.type,eventId:event.id});
  return event.id;
}
export async function persistSmsEvent(db:any,queue:SmsEventQueue,event:SmsEvent){
  try{return await acceptSmsEvent(queue,event);}
  catch(error){
    if(!db)throw error;
    if(error instanceof SmsEventError&&!error.transient)throw error;
    const hash=await eventHash(smsEventPayload(event));
    await db.prepare('INSERT OR IGNORE INTO sms_event_outbox(id,payload_hash,payload_json) VALUES(?,?,?)').bind(event.id,hash,JSON.stringify(event)).run();
    const row=await db.prepare('SELECT payload_hash FROM sms_event_outbox WHERE id=?').bind(event.id).first();
    if(row?.payload_hash!==hash)throw new SmsEventError('IDEMPOTENCY_CONFLICT',false);
    smsLog('outbox_accepted',{requestId:event.requestId,eventType:event.type,eventId:event.id});return event.id;
  }
}
export function forgetSmsAcceptance(queue:SmsEventQueue,id:string){recentAcceptances.get(queue as object)?.delete(id);}
export function retryDelay(attempt:number){return Math.min(900,15*2**Math.min(6,Math.max(0,attempt-1)));}
