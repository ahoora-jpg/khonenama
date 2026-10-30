import { authenticateAgent, handleBridge } from "./bridge";
import { ensureSmsSchema } from "./schema";
import { crossSiteMutation, securityHeaders } from "../../request-security";
import {makeSmsEvent,persistSmsEvent,smsRequestId,smsFailure,smsLog,type SmsEventQueue} from './events';

let controlInFlight=0;
let unavailableUntil=0;

/** Dispatch the machine API before the HTML router, preserving its security boundary. */
export async function handleWorkerBridge(request: Request, db: any,options:{migrating?:boolean;queue?:SmsEventQueue;rateLimiter?:{limit(input:{key:string}):Promise<{success:boolean}>}}={}): Promise<Response> {
  const requestId=smsRequestId(request),started=Date.now();let action='unknown';
  const protect = (response: Response) => {
    for (const [key,value] of Object.entries(securityHeaders)) response.headers.set(key,value);
    response.headers.set("Cache-Control","private, no-store");
    response.headers.set('X-Request-Id',requestId);
    return response;
  };
  const fail = (status:number,error:string) => protect(Response.json({ok:false,error},{status}));
  const url=new URL(request.url);
  if(url.protocol!=="https:") {url.protocol="https:";url.port="";return protect(new Response(null,{status:308,headers:{Location:url.href}}));}
  if(request.method!=="POST")return protect(Response.json({ok:false,error:"METHOD_NOT_ALLOWED"},{status:405,headers:{Allow:"POST"}}));
  if(crossSiteMutation(request))return fail(403,"FORBIDDEN");
  if(!await authenticateAgent(request))return fail(401,"UNAUTHORIZED");
  if(Number(request.headers.get("content-length")||0)>65536)return fail(413,"REQUEST_TOO_LARGE");
  const reader=request.body?.getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try {
    if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>65536){await reader.cancel();return fail(413,"REQUEST_TOO_LARGE");}chunks.push(part.value);}
  } catch {return fail(400,"INVALID_REQUEST");}
  const body=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
  let input:any;try{input=JSON.parse(new TextDecoder().decode(body));}catch{return fail(400,'INVALID_JSON');}
  if(!input||typeof input!=='object'||Array.isArray(input))return fail(400,'INVALID_JSON');
  action=String(input.action||'');
  if(!['heartbeat','inboxSenders','inboxHealthy','claim','authorize','reconcile','report','inbound'].includes(action))return fail(400,'UNKNOWN_ACTION');
  if(options.rateLimiter&&!(await options.rateLimiter.limit({key:'sms-bridge-agent'})).success){const r=fail(429,'RATE_LIMITED');r.headers.set('Retry-After','60');return r;}
  const asyncEvents=options.queue&&(request.headers.get('x-sms-event-protocol')==='1'||options.migrating)&&['report','inbound'].includes(action);
  if(asyncEvents){
    const clean:Record<string,unknown>={action};
    if(action==='report'){
      if(typeof input.messageId!=='string'||!/^[a-zA-Z0-9:_-]{1,120}$/.test(input.messageId)||typeof input.leaseToken!=='string'||!/^[a-zA-Z0-9:_-]{1,120}$/.test(input.leaseToken)||typeof input.gatewayMessageId!=='string'||!/^[a-zA-Z0-9:_-]{1,120}$/.test(input.gatewayMessageId)||!(input.uncertain===true||['Pending','Processed','Sent','Delivered','Failed','Cancelled'].includes(input.gatewayState)))return fail(400,'INVALID_REPORT');
      Object.assign(clean,{messageId:input.messageId,leaseToken:input.leaseToken,gatewayMessageId:input.gatewayMessageId,...(input.uncertain===true?{uncertain:true}:{gatewayState:input.gatewayState})});
    }else{
      if(typeof input.id!=='string'||!input.id||input.id.length>120||typeof input.sender!=='string'||input.sender.length>32||typeof input.body!=='string'||input.body.length>1000||!Number.isFinite(Date.parse(input.receivedAt)))return fail(400,'INVALID_INBOUND');
      Object.assign(clean,{id:input.id,sender:input.sender,body:input.body,receivedAt:input.receivedAt});
    }
    const event=await makeSmsEvent(action==='report'?'bridge_report':'bridge_inbound',clean,requestId);
    try{await persistSmsEvent(db,options.queue!,event);return protect(Response.json({ok:true,accepted:true,eventId:event.id},{status:202}));}
    catch(error){const failure=smsFailure(error);smsLog('not_accepted',{requestId,eventType:action,eventId:event.id,reason:failure.code});const r=fail(failure.transient?503:409,failure.transient?'BRIDGE_UNAVAILABLE':failure.code);r.headers.set('Retry-After','30');return r;}
  }
  if(options.migrating){const r=fail(429,'SMS_MIGRATION_RETRY');r.headers.set('Retry-After','30');return r;}
  if(Date.now()<unavailableUntil){const r=fail(503,'BRIDGE_UNAVAILABLE');r.headers.set('Retry-After',String(Math.max(1,Math.ceil((unavailableUntil-Date.now())/1000))));return r;}
  if(controlInFlight>=8){const r=fail(429,'BRIDGE_BUSY');r.headers.set('Retry-After','2');return r;}
  controlInFlight++;
  try {
    await ensureSmsSchema(db);
    const response=await handleBridge(new Request(request.url,{method:"POST",headers:request.headers,body}));
    smsLog('response',{requestId,eventType:action,durationMs:Date.now()-started});return protect(response);
  } catch(error) {
    const failure=smsFailure(error);if(failure.transient)unavailableUntil=Date.now()+(failure.code==='D1_QUOTA'?300000:15000);
    smsLog('failed',{requestId,eventType:action,reason:failure.code,durationMs:Date.now()-started});
    const response=fail(503,'BRIDGE_UNAVAILABLE');response.headers.set('Retry-After',failure.code==='D1_QUOTA'?'300':'15');response.headers.set('X-SMS-Error-Class',failure.code);return response;
  }finally{controlInFlight--;}
}
