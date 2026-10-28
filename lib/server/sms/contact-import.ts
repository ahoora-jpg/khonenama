import {TENANT,normalizePhone,phoneHash} from './domain';
export const CONTACT_IMPORT_SQL=`INSERT INTO sms_contacts(id,tenant_id,phone_e164,display_name,source)
 SELECT json_extract(value,'$.id'),?,json_extract(value,'$.phone'),json_extract(value,'$.name'),'csv_import' FROM json_each(?) WHERE 1
 ON CONFLICT(tenant_id,phone_e164) DO UPDATE SET display_name=CASE WHEN trim(excluded.display_name)<>'' THEN excluded.display_name ELSE sms_contacts.display_name END`;
export const MEMBER_IMPORT_SQL=`INSERT OR IGNORE INTO sms_group_members(tenant_id,group_id,contact_id)
 SELECT ?,?,c.id FROM json_each(?) j CROSS JOIN sms_contacts c ON c.tenant_id=? AND c.phone_e164=json_extract(j.value,'$.phone') WHERE c.source<>'removed'`;
export const PROFILE_IMPORT_SQL=`INSERT INTO sms_contact_profiles(contact_id,city,area,trade)
 SELECT c.id,json_extract(j.value,'$.city'),json_extract(j.value,'$.area'),json_extract(j.value,'$.trade') FROM json_each(?) j
 CROSS JOIN sms_contacts c ON c.phone_e164=json_extract(j.value,'$.phone') AND c.tenant_id=? WHERE c.source<>'removed'
 ON CONFLICT(contact_id) DO UPDATE SET city=CASE WHEN excluded.city<>'' THEN excluded.city ELSE sms_contact_profiles.city END,
 area=CASE WHEN excluded.area<>'' THEN excluded.area ELSE sms_contact_profiles.area END,trade=CASE WHEN excluded.trade<>'' THEN excluded.trade ELSE sms_contact_profiles.trade END`;
export async function importContactRows(db:any,groupId:string,header:string[],rows:string[][],requireName=false){
 const accepted:any[]=[];let invalid=0;
 const candidates=await Promise.all(rows.map(async row=>{const phone=normalizePhone(String(row[0]||'').replace(/^'/,''));return {row,phone,hash:phone?await phoneHash(phone):''};}));
 const hashes=candidates.filter(r=>r.phone).map(r=>r.hash),blocked=new Set<string>();
 for(let offset=0;offset<hashes.length;offset+=80){const part=hashes.slice(offset,offset+80);const result=await db.prepare(`SELECT phone_hash FROM sms_removed_records WHERE tenant_id=? AND kind='contact' AND phone_hash IN (${part.map(()=>'?').join(',')})`).bind(TENANT,...part).all();for(const r of result.results||[])blocked.add(r.phone_hash);}
 for(const {row,phone,hash} of candidates){const name=String(row[header.indexOf('name')]||'').trim().slice(0,120);if(!phone||blocked.has(hash)||requireName&&!name){invalid++;continue;}const metadata=['city','area','trade'].map(key=>String(row[header.indexOf(key)]||'').trim().slice(0,100));accepted.push({id:crypto.randomUUID(),phone,name,city:metadata[0],area:metadata[1],trade:metadata[2]});}
 if(accepted.length){const payload=JSON.stringify(accepted);await db.batch([
 db.prepare(CONTACT_IMPORT_SQL).bind(TENANT,payload),db.prepare(MEMBER_IMPORT_SQL).bind(TENANT,groupId,payload,TENANT),db.prepare(PROFILE_IMPORT_SQL).bind(payload,TENANT),
 db.prepare("INSERT INTO sms_audit_logs(tenant_id,actor,action,target_id,detail) VALUES(?,'site_admin','csv_import',?,?)").bind(TENANT,groupId,JSON.stringify({imported:accepted.length,invalid}))]);}
 return {imported:accepted.length,invalid};
}
