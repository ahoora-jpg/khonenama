import {makeSmsEvent,acceptSmsEvent,SmsEventError,type SmsEvent,type SmsEventQueue} from './events';
export const projectionSchema=[
 "CREATE TABLE IF NOT EXISTS business_visibility_controls(business_id INTEGER PRIMARY KEY,owner_paused INTEGER NOT NULL DEFAULT 0)",
 "CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,phone TEXT)",
 "CREATE TABLE IF NOT EXISTS businesses(id INTEGER PRIMARY KEY,owner_user_id TEXT,status TEXT,name TEXT,phone TEXT,slug TEXT)",
 "CREATE INDEX IF NOT EXISTS idx_sms_projection_owner ON businesses(owner_user_id,status)",
 "CREATE INDEX IF NOT EXISTS idx_sms_projection_phone ON users(phone)",
 "CREATE TABLE IF NOT EXISTS sms_site_projection_versions(entity TEXT NOT NULL,entity_key TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(entity,entity_key))"
];
export async function drainSiteProjection(db:any,queue?:SmsEventQueue){
 if(!queue)return 0;
 const rows=await db.prepare('SELECT id,entity,entity_key,operation,payload_json FROM sms_site_sync_outbox WHERE queued_at IS NULL ORDER BY id LIMIT 50').all();let count=0;
 for(const row of rows.results||[]){try{const event=await makeSmsEvent('site_sync',{version:row.id,entity:row.entity,key:row.entity_key,operation:row.operation,row:JSON.parse(row.payload_json)},'site-sync:'+row.id,'site-sync:'+row.id);await acceptSmsEvent(queue,event);await db.prepare('UPDATE sms_site_sync_outbox SET queued_at=CURRENT_TIMESTAMP WHERE id=?').bind(row.id).run();count++;}catch{break;}}
 return count;
}
export async function applySiteProjection(db:any,event:SmsEvent,applied:any){
 const p=event.payload;
 if(!['user','business','visibility'].includes(p.entity)||!['upsert','delete'].includes(p.operation)||!Number.isSafeInteger(p.version)||p.version<1||String(p.entity==='visibility'?p.row?.business_id:p.row?.id)!==p.key)throw new SmsEventError('INVALID_SITE_PROJECTION',false);
 const table=p.entity==='user'?'users':p.entity==='visibility'?'business_visibility_controls':'businesses',fields=p.entity==='user'?['id','phone']:p.entity==='visibility'?['business_id','owner_paused']:['id','owner_user_id','status','name','phone','slug'],key=fields[0];
 const condition="NOT EXISTS(SELECT 1 FROM sms_site_projection_versions WHERE entity=? AND entity_key=? AND version>=?)";
 const write=p.operation==='delete'?db.prepare('DELETE FROM '+table+' WHERE '+key+'=? AND '+condition).bind(p.row[key],p.entity,p.key,p.version):db.prepare('INSERT INTO '+table+'('+fields.join(',')+') SELECT '+fields.map(()=>'?').join(',')+' WHERE '+condition+' ON CONFLICT('+key+') DO UPDATE SET '+fields.slice(1).map(f=>f+'=excluded.'+f).join(',')).bind(...fields.map(f=>p.row[f]??null),p.entity,p.key,p.version);
 await db.batch([write,db.prepare('INSERT INTO sms_site_projection_versions(entity,entity_key,version) VALUES(?,?,?) ON CONFLICT(entity,entity_key) DO UPDATE SET version=MAX(version,excluded.version)').bind(p.entity,p.key,p.version),applied]);return {atomicApplied:true};
}
