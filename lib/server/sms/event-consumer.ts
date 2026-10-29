import {eventHash,retryDelay,smsFailure,smsLog,SmsEventError,smsEventPayload,validSmsEvent,type SmsEvent} from './events';
type Message={body:unknown;attempts?:number;ack():void;retry(options:{delaySeconds:number}):void};
type Bindings={DB:any;SMS_EVENTS_DLQ?:{send(value:unknown):Promise<unknown>};SMS_EVENT_ARCHIVE?:{put(key:string,value:string,options?:unknown):Promise<unknown>};SMS_EVENT_SINK?:{fetch(request:Request):Promise<Response>}};
export type ApplyEvent=(event:SmsEvent,appliedStatement:any,leaseToken:string)=>Promise<{atomicApplied?:boolean}|void>;

/** At-least-once delivery with an atomic application marker and separately retryable effects. */
export async function consumeSmsEvents(batch:{messages:Message[]},env:Bindings,apply:ApplyEvent){
  const process=async(message:Message)=>{
    const event=message.body;
    if(!validSmsEvent(event)){
      if(!env.SMS_EVENTS_DLQ){message.retry({delaySeconds:900});return;}
      await env.SMS_EVENTS_DLQ.send({invalid:true,body:event,reason:'INVALID_EVENT'});message.ack();return;
    }
    const db=env.DB,hash=await eventHash(smsEventPayload(event)),lease=crypto.randomUUID();
    let ownsLease=false;
    try{
      await db.prepare("INSERT OR IGNORE INTO sms_event_receipts(id,type,payload_hash,payload_json) VALUES(?,?,?,?)").bind(event.id,event.type,hash,JSON.stringify(event)).run();
      const row=await db.prepare('SELECT state,payload_hash,applied_at,lease_until,attempts FROM sms_event_receipts WHERE id=?').bind(event.id).first();
      if(row.payload_hash!==hash)throw new SmsEventError('IDEMPOTENCY_CONFLICT',false);
      if(row.state==='done'){message.ack();return;}
      if(row.state==='failed'){
        if(!env.SMS_EVENTS_DLQ){message.retry({delaySeconds:900});return;}
        await env.SMS_EVENTS_DLQ.send({event,reason:'ALREADY_FAILED'});message.ack();return;
      }
      const claimed=await db.prepare("UPDATE sms_event_receipts SET state='processing',lease_token=?,lease_until=datetime('now','+2 minutes'),attempts=attempts+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND (state IN('pending','retry') OR (state='processing' AND lease_until<CURRENT_TIMESTAMP)) RETURNING id").bind(lease,event.id).first();
      if(!claimed){message.retry({delaySeconds:15});return;}
      ownsLease=true;
      const applied=db.prepare('UPDATE sms_event_receipts SET applied_at=CURRENT_TIMESTAMP WHERE id=? AND lease_token=? AND applied_at IS NULL').bind(event.id,lease);
      if(!row.applied_at){const result=await apply(event,applied,lease);if(!result?.atomicApplied)await applied.run();}
      const ownership=await db.prepare('SELECT lease_token,applied_at FROM sms_event_receipts WHERE id=?').bind(event.id).first();
      if(ownership?.lease_token!==lease||!ownership.applied_at)throw new SmsEventError('LEASE_LOST');
      if(env.SMS_EVENT_SINK){
        const response=await env.SMS_EVENT_SINK.fetch(new Request('https://sms-events.internal/events',{method:'POST',headers:{'content-type':'application/json','idempotency-key':event.id},body:JSON.stringify(event),signal:AbortSignal.timeout(12000)}));
        if(!response.ok)throw new SmsEventError('SINK_HTTP_'+response.status,response.status===429||response.status>=500);
      }
      await db.prepare("UPDATE sms_event_receipts SET state='done',lease_token=NULL,lease_until=NULL,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND lease_token=?").bind(event.id,lease).run();
      smsLog('processed',{requestId:event.requestId,eventType:event.type,eventId:event.id,messageId:event.payload.messageId,businessId:event.payload.businessId,attempt:message.attempts||row.attempts+1});message.ack();
    }catch(error){
      const failure=smsFailure(error),attempt=message.attempts||1,permanent=!failure.transient||attempt>=6;
      if(ownsLease){
        try{await db.prepare("UPDATE sms_event_receipts SET state=?,last_error=?,lease_token=NULL,lease_until=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND lease_token=? AND payload_hash=?").bind(permanent?'failed':'retry',failure.code,event.id,lease,hash).run();}catch{/* Queue/DLQ remains the durable copy while D1 is unavailable. */}
      }
      smsLog(permanent?'dead_letter':'retry',{requestId:event.requestId,eventType:event.type,eventId:event.id,messageId:event.payload.messageId,businessId:event.payload.businessId,attempt,reason:failure.code});
      if(permanent&&env.SMS_EVENT_ARCHIVE){
        try{await env.SMS_EVENT_ARCHIVE.put('failed/'+event.id+'.json',JSON.stringify({event,reason:failure.code,attempt}),{httpMetadata:{contentType:'application/json'}});}
        catch{message.retry({delaySeconds:900});return;}
      }
      if(permanent&&env.SMS_EVENTS_DLQ){
        try{await env.SMS_EVENTS_DLQ.send({event,reason:failure.code,attempt});message.ack();return;}catch{/* Never acknowledge an unarchived failed event. */}
      }
      message.retry({delaySeconds:retryDelay(attempt)});
    }
  };
  // Bound D1/sink concurrency; a failed event never discards the other messages in its batch.
  for(let offset=0;offset<batch.messages.length;offset+=4)await Promise.all(batch.messages.slice(offset,offset+4).map(process));
}

export async function drainAccessEvents(db:any,queue?:{send(event:unknown):Promise<unknown>}){
  if(!queue)return 0;
  const rows=await db.prepare('SELECT id,scope,subject_id,business_id,lead_id,link_id,previous_locked,locked,occurred_at FROM sms_access_state_events WHERE queued_at IS NULL ORDER BY occurred_at,id LIMIT 50').all();
  let count=0;
  for(const row of rows.results||[]){
    const {makeSmsEvent,acceptSmsEvent}=await import('./events');
    const event=await makeSmsEvent('access_state',row,'access:'+row.id,row.id);
    try{await acceptSmsEvent(queue,event);await db.prepare('UPDATE sms_access_state_events SET queued_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.id).run();count++;}
    catch(error){smsLog('access_outbox_pending',{requestId:event.requestId,eventType:event.type,eventId:event.id,reason:smsFailure(error).code});break;}
  }
  return count;
}
export async function drainSmsOutbox(db:any,queue?:{send(event:unknown):Promise<unknown>}){
  if(!queue)return 0;
  const rows=await db.prepare('SELECT id,payload_json FROM sms_event_outbox WHERE queued_at IS NULL ORDER BY created_at,id LIMIT 50').all();
  let count=0;
  for(const row of rows.results||[]){
    try{await queue.send(JSON.parse(row.payload_json));await db.prepare('UPDATE sms_event_outbox SET queued_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.id).run();count++;}
    catch{break;}
  }
  return count;
}
