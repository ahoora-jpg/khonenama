import {SmsEventError,type SmsEvent} from './events';
import {recordAcquisitionConversion} from './acquisition';

/** Apply projections in the same transaction as the replay marker. Raw events remain in receipts. */
export async function applyAcquisitionEvent(db:any,event:SmsEvent,applied:any,leaseToken:string){
  const p=event.payload;
  if(event.type==='access_state'){
    await db.batch([db.prepare('UPDATE sms_access_state_events SET processed_at=CURRENT_TIMESTAMP WHERE id=?').bind(p.id),applied]);return {atomicApplied:true};
  }
  if(event.type==='click'){
    if(typeof p.token!=='string'||!/^([a-f0-9]{40})$/.test(p.token)||typeof p.session!=='string'||!/^[a-f0-9]{40}$/.test(p.session))throw new SmsEventError('INVALID_CLICK',false);
    const link=await db.prepare("SELECT l.*,s.tracking_enabled FROM sms_recipient_links l JOIN sms_acquisition_settings s ON s.tenant_id=l.tenant_id WHERE l.token=? AND l.tenant_id='khonenama'").bind(p.token).first();
    if(!link)throw new SmsEventError('LINK_NOT_FOUND',false);
    if(!p.validatedAtAccept&&(!link.active||(link.expires_at&&Date.parse(link.expires_at)<=Date.parse(event.occurredAt))))throw new SmsEventError('LINK_NOT_ACTIVE_AT_ACCEPTANCE',false);
    if(!link.tracking_enabled&&!p.validatedAtAccept){await applied.run();return {atomicApplied:true};}
    const suspicious=p.suspicious===true,statements=[
      db.prepare("INSERT INTO sms_click_totals(link_id,total,suspicious,first_click,last_click) SELECT ?,1,?,?,? WHERE EXISTS(SELECT 1 FROM sms_event_receipts WHERE id=? AND lease_token=? AND state='processing' AND applied_at IS NULL) ON CONFLICT(link_id) DO UPDATE SET total=total+1,suspicious=suspicious+excluded.suspicious,first_click=CASE WHEN julianday(excluded.first_click)<julianday(first_click) THEN excluded.first_click ELSE first_click END,last_click=CASE WHEN julianday(excluded.last_click)>julianday(last_click) THEN excluded.last_click ELSE last_click END").bind(link.id,suspicious?1:0,event.occurredAt,event.occurredAt,event.id,leaseToken),
      db.prepare("INSERT OR IGNORE INTO sms_link_events(id,link_id,kind,session_id,suspicious,created_at) VALUES(?,?,'click',?,?,?)").bind(event.id,link.id,p.session,suspicious?1:0,event.occurredAt),
    ];
    if(!suspicious)statements.push(db.prepare("INSERT INTO sms_attribution_sessions(id,first_link_id,last_link_id,created_at,last_clicked_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET first_link_id=CASE WHEN julianday(excluded.last_clicked_at)>julianday(sms_attribution_sessions.last_clicked_at,'+30 days') THEN excluded.first_link_id WHEN julianday(excluded.last_clicked_at)<julianday(sms_attribution_sessions.created_at) THEN excluded.first_link_id ELSE sms_attribution_sessions.first_link_id END,last_link_id=CASE WHEN julianday(excluded.last_clicked_at)>=julianday(sms_attribution_sessions.last_clicked_at) THEN excluded.last_link_id ELSE sms_attribution_sessions.last_link_id END,created_at=MIN(created_at,excluded.created_at),last_clicked_at=MAX(last_clicked_at,excluded.last_clicked_at)").bind(p.session,link.id,link.id,event.occurredAt,event.occurredAt));
    statements.push(applied);await db.batch(statements);return {atomicApplied:true};
  }
  if(event.type==='stage'){
    if(!['registration_view','registration_start','booth_start'].includes(p.kind)||!/^([a-f0-9]{40})$/.test(p.session||''))throw new SmsEventError('INVALID_STAGE',false);
    const session=await db.prepare('SELECT last_link_id,last_clicked_at FROM sms_attribution_sessions WHERE id=?').bind(p.session).first();
    if(!session)throw new SmsEventError('ATTRIBUTION_NOT_READY');
    await db.batch([db.prepare("INSERT OR IGNORE INTO sms_link_events(id,link_id,kind,session_id,created_at) SELECT ?,s.last_link_id,?,s.id,? FROM sms_attribution_sessions s JOIN sms_recipient_links l ON l.id=s.last_link_id JOIN sms_acquisition_settings settings ON settings.tenant_id=l.tenant_id WHERE s.id=? AND julianday(s.last_clicked_at)>=julianday(?,'-30 days') AND settings.tracking_enabled=1 AND l.active=1 AND (l.expires_at IS NULL OR julianday(l.expires_at)>julianday(?))").bind(event.id,p.kind,event.occurredAt,p.session,event.occurredAt,event.occurredAt),applied]);return {atomicApplied:true};
  }
  if(event.type==='conversion'){
    const exists=await db.prepare('SELECT id FROM sms_attribution_sessions WHERE id=?').bind(p.session).first();if(!exists)throw new SmsEventError('ATTRIBUTION_NOT_READY');
    await recordAcquisitionConversion(db,new Request('https://khonenama.ir/register-business',{headers:{cookie:'kn_sms_visit='+p.session}}),p.input);
    return;
  }
  throw new SmsEventError('UNKNOWN_EVENT_TYPE',false);
}
