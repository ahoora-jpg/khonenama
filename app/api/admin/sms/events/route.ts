import {env} from 'cloudflare:workers';
import {isSmsAdminRequest} from '@/lib/server/sms/admin-auth';
import {crossSiteMutation} from '@/lib/request-security';
import {eventHash,smsEventPayload,smsFailure,smsLog,smsRequestId,validSmsEvent} from '@/lib/server/sms/events';
const headers={'Cache-Control':'private, no-store'};
export async function GET(request:Request){
  if(!await isSmsAdminRequest(request))return Response.json({ok:false},{status:401,headers});
  const db=(env as any).DB,url=new URL(request.url),state=url.searchParams.get('state')||'failed';
  if(!['pending','processing','retry','done','failed'].includes(state))return Response.json({ok:false,error:'INVALID_STATE'},{status:400,headers});
  try {
  const rows=await db.prepare('SELECT id,type,state,attempts,applied_at,last_error,created_at,updated_at FROM sms_event_receipts WHERE tenant_id=? AND state=? ORDER BY updated_at DESC LIMIT 50').bind('khonenama',state).all();
  const access=await db.prepare('SELECT id,scope,subject_id,business_id,lead_id,link_id,previous_locked,locked,occurred_at,queued_at,processed_at FROM sms_access_state_events ORDER BY occurred_at DESC,id LIMIT 50').all();
  const pending=await db.prepare('SELECT count(*) n FROM sms_event_outbox WHERE queued_at IS NULL').first();
  const archive=(env as any).SMS_EVENT_ARCHIVE;
  const archived=archive?await archive.list({prefix:'failed/',limit:50}):{objects:[]};
  return Response.json({ok:true,events:rows.results,accessStates:access.results,pendingOutbox:pending.n,archivedFailures:archived.objects.map((o:any)=>({id:o.key.slice(7,-5),uploaded:o.uploaded}))},{headers});
  }catch(error){smsLog('inspection_unavailable',{requestId:smsRequestId(request),reason:smsFailure(error).code});return Response.json({ok:false,error:'EVENT_INSPECTION_UNAVAILABLE'},{status:503,headers});}
}
export async function POST(request:Request){
  if(crossSiteMutation(request))return Response.json({ok:false},{status:403,headers});
  if(!await isSmsAdminRequest(request))return Response.json({ok:false},{status:401,headers});
  const b=await request.json().catch(()=>null),settings=env as any,requestId=smsRequestId(request);
  if(b?.action!=='replay'||typeof b?.id!=='string'||!/^[a-z_]+:[a-f0-9]{64}$/.test(b.id))return Response.json({ok:false,error:'INVALID_EVENT'},{status:400,headers});
  if(!settings.SMS_EVENTS)return Response.json({ok:false,error:'EVENT_QUEUE_NOT_CONFIGURED'},{status:503,headers});
  try {
  let row=await settings.DB.prepare("SELECT payload_json FROM sms_event_receipts WHERE id=? AND tenant_id='khonenama' AND state='failed'").bind(b.id).first();
  if(!row&&settings.SMS_EVENT_ARCHIVE){
    const archived=await settings.SMS_EVENT_ARCHIVE.get('failed/'+b.id+'.json');
    if(archived){
      const saved=await archived.json();
      if(validSmsEvent(saved.event)&&saved.event.id===b.id){
        const payload=JSON.stringify(saved.event),hash=await eventHash(smsEventPayload(saved.event));
        await settings.DB.prepare("INSERT OR IGNORE INTO sms_event_receipts(id,type,payload_hash,payload_json,state,last_error) VALUES(?,?,?,?,'failed','ARCHIVED_FAILURE')").bind(b.id,saved.event.type,hash,payload).run();
        row=await settings.DB.prepare("SELECT payload_json FROM sms_event_receipts WHERE id=? AND state='failed'").bind(b.id).first();
      }
    }
  }
  if(!row)return Response.json({ok:false,error:'EVENT_NOT_FAILED'},{status:409,headers});
    const event=JSON.parse(row.payload_json),hash=await eventHash(smsEventPayload(event));
    const results=await settings.DB.batch([
      settings.DB.prepare("UPDATE sms_event_receipts SET state='retry',lease_token=NULL,lease_until=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=? AND state='failed'").bind(b.id),
      settings.DB.prepare("INSERT INTO sms_event_outbox(id,payload_hash,payload_json) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM sms_event_receipts WHERE id=? AND state='retry') ON CONFLICT(id) DO UPDATE SET queued_at=NULL").bind(b.id,hash,row.payload_json,b.id),
    ]);
    if(!results[0].meta?.changes)return Response.json({ok:false,error:'EVENT_NOT_FAILED'},{status:409,headers});
    return Response.json({ok:true,accepted:true,eventId:b.id},{status:202,headers});
  }catch(error){
    smsLog('replay_pending',{requestId,eventId:b.id,reason:smsFailure(error).code});return Response.json({ok:false,error:'REPLAY_NOT_ACCEPTED'},{status:503,headers});}
}
