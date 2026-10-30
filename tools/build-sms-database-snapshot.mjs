import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Source and destination SQL paths required');
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(input,'utf8'));
const quote=v=>v===null?'NULL':typeof v==='number'||typeof v==='bigint'?String(v):v instanceof Uint8Array?"X'"+Buffer.from(v).toString('hex')+"'":"'"+String(v).replaceAll("'","''")+"'";
const tables=db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' AND name GLOB 'sms_*' AND name NOT IN('sms_site_sync_outbox','sms_site_projection_versions') ORDER BY rowid").all();
let sql='PRAGMA defer_foreign_keys=ON;\n';const manifest={};
for(const table of tables){sql+=table.sql+';\n';const rows=db.prepare('SELECT * FROM "'+table.name+'"').all();manifest[table.name]={count:rows.length,sha256:createHash('sha256').update(JSON.stringify(rows)).digest('hex')};for(const row of rows)sql+='INSERT INTO "'+table.name+'"('+Object.keys(row).map(k=>'"'+k+'"').join(',')+') VALUES('+Object.values(row).map(quote).join(',')+');\n';}
const names=new Set(tables.map(t=>t.name));for(const item of db.prepare("SELECT type,tbl_name,sql FROM sqlite_master WHERE type IN('index','trigger') AND sql IS NOT NULL ORDER BY type").all())if(names.has(item.tbl_name))sql+=item.sql+';\n';
for(const [table,fields,create] of [['business_visibility_controls',['business_id','owner_paused'],'business_id INTEGER PRIMARY KEY,owner_paused INTEGER NOT NULL DEFAULT 0'],['users',['id','phone'],'id TEXT PRIMARY KEY,phone TEXT'],['businesses',['id','owner_user_id','status','name','phone','slug'],'id INTEGER PRIMARY KEY,owner_user_id TEXT,status TEXT,name TEXT,phone TEXT,slug TEXT']]){
 sql+='CREATE TABLE '+table+'('+create+');\n';for(const row of db.prepare('SELECT '+fields.join(',')+' FROM '+table).all())sql+='INSERT INTO '+table+' VALUES('+Object.values(row).map(quote).join(',')+');\n';
}
sql+='CREATE INDEX idx_sms_projection_owner ON businesses(owner_user_id,status);\nCREATE INDEX idx_sms_projection_phone ON users(phone);\nCREATE TABLE sms_site_projection_versions(entity TEXT NOT NULL,entity_key TEXT NOT NULL,version INTEGER NOT NULL,PRIMARY KEY(entity,entity_key));\n';
for(const row of db.prepare('SELECT entity,entity_key,MAX(id) version FROM sms_site_sync_outbox GROUP BY entity,entity_key').all())sql+='INSERT INTO sms_site_projection_versions VALUES('+Object.values(row).map(quote).join(',')+');\n';
fs.writeFileSync(output,sql);fs.writeFileSync(output+'.manifest.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({tables:tables.length,rows:Object.values(manifest).reduce((n,t)=>n+t.count,0),bytes:Buffer.byteLength(sql)}));db.close();
