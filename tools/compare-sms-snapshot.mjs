import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import {createHash} from 'node:crypto';
const [sourcePath,targetPath]=process.argv.slice(2);const a=new DatabaseSync(':memory:'),b=new DatabaseSync(':memory:');a.exec(fs.readFileSync(sourcePath,'utf8'));b.exec(fs.readFileSync(targetPath,'utf8'));
const names=a.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name GLOB 'sms_*' AND name NOT IN('sms_site_sync_outbox','sms_site_projection_versions') ORDER BY name").all().map(r=>r.name);
const hash=rows=>createHash('sha256').update(rows.map(r=>JSON.stringify(r)).sort().join('\n')).digest('hex');const differences=[];let rows=0;
for(const name of names){const ar=a.prepare('SELECT * FROM "'+name+'"').all(),br=b.prepare('SELECT * FROM "'+name+'"').all();rows+=ar.length;if(hash(ar)!==hash(br))differences.push({table:name,source:ar.length,target:br.length});}
for(const [name,fields] of [['users','id,phone'],['businesses','id,owner_user_id,status,name,phone,slug'],['business_visibility_controls','business_id,owner_paused']])if(hash(a.prepare('SELECT '+fields+' FROM '+name).all())!==hash(b.prepare('SELECT '+fields+' FROM '+name).all()))differences.push({table:name});
a.close();b.close();console.log(JSON.stringify({tables:names.length,rows,identical:differences.length===0,differences}));if(differences.length)process.exitCode=1;
