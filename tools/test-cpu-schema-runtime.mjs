import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import {planMediaColumns} from './plan-cpu-media-migration.mjs';

const forbidden=/CREATE\s+(?:TABLE|INDEX|TRIGGER)|ALTER\s+TABLE|PRAGMA\s+table_info|sqlite_master/i;
function loader(env,logs=[]){
 const cache=new Map();
 function load(file){
  file=resolve(file);if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports,require:name=>{
   if(name==='cloudflare:workers')return{env};
   if(name==='vinext/server/app-router-entry')return{default:{fetch:()=>{throw Error('Not a scheduled operation')}}};
   if(name==='@block65/webcrypto-web-push')return{buildPushPayload:()=>{throw Error('No real provider calls permitted')}};
   return load((name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(file),name))+'.ts');
  },crypto:webcrypto,Request,Response,Headers,URL,TextEncoder,TextDecoder,Uint8Array,AbortSignal,btoa,console:{...console,log:(...args)=>logs.push(args),warn:(...args)=>logs.push(args),error:(...args)=>logs.push(args)},fetch:()=>{throw Error('No external network permitted')},setTimeout});
  return exports;
 }
 return load;
}
async function scheduled(role,minute){
 const queries=[],sent=[],failures=[];let pending=true;
 const db={prepare(sql){if(forbidden.test(sql))failures.push(sql);assert.ok(!forbidden.test(sql),'Scheduled schema work: '+sql);queries.push(sql);return{bind(){return this},async first(){return null},async all(){if(sql.startsWith('SELECT id,payload_json FROM sms_event_outbox')&&pending)return{results:[{id:'fixture-outbox',payload_json:JSON.stringify({id:'fixture-event'})}]};return{results:[]}},async run(){if(sql.startsWith('UPDATE sms_event_outbox'))pending=false;return{meta:{changes:1}}}}},async batch(statements){return Promise.all(statements.map(s=>s.run()))}};
 const env={DB:db,SMS_ROLE:role,SMS_LIVE_SEND_ENABLED:'true',SMS_EVENTS:{send:async event=>sent.push(event)},RESEND_API_KEY:'synthetic-provider-fixture',RECOVERY_EMAIL_FROM:'fixture@example.com'};
 const logs=[];const worker=loader(env,logs)('worker.ts').default;
 const promises=[];worker.scheduled({scheduledTime:Date.UTC(2026,10,2,0,minute)},env,{waitUntil:p=>promises.push(p)});
 // Individual jobs catch errors; surface any hidden failure by recording its log.
 await Promise.all(promises);
 assert.equal(failures.length,0,'Scheduled schema SQL rejected');
 assert.equal(logs.length,0,'Scheduled jobs failed: '+JSON.stringify(logs));
 return {queries,sent,failures};
}
test('Every cron cadence uses migrated tables without DDL, PRAGMA or schema probes',async()=>{
 for(const role of ['site','panel'])for(const minute of [2,10,30,0]){
  const {queries,sent}=await scheduled(role,minute);
  assert.ok(queries.length>0);assert.equal(sent.length,1);assert.equal(sent[0].id,'fixture-event');
  assert.ok(!queries.some(q=>q.includes('SELECT id FROM sms_event_receipts LIMIT 0')));
 }
});
test('Fast cron keeps queue/campaign safety but excludes daily retention and periodic reminder scans',async()=>{
 const fast=await scheduled('panel',2),daily=await scheduled('panel',0),site=await scheduled('site',2);
 assert.ok(fast.queries.some(q=>q.includes("status='leased'")));
 assert.ok(fast.queries.some(q=>q.includes('FROM sms_campaigns')));
 assert.ok(!fast.queries.some(q=>q.includes('-90 days')||q.includes('INSERT OR IGNORE INTO sms_acquisition_conversions')));
 assert.ok(daily.queries.some(q=>q.includes('-90 days')));
 assert.ok(!site.queries.some(q=>q.includes('profile_photo_reminders')||q.includes('media_retention_deletions')));
 assert.ok(!site.queries.some(q=>q.includes('FROM sms_campaigns')),'Site isolation must stay intact');
});
test('Public readers do not import their former schema initializers',()=>{
 const source=readFileSync('lib/server/public-businesses.ts','utf8');
 for(const name of ['ensureVisibilitySchema','ensureBusinessMediaSchema','ensureReviewReplies','ensureBusinessCoverage'])assert.ok(!source.includes(name),name);
 assert.ok(!forbidden.test(source));
});
test('Public model and album reads execute no schema work, including cold calls',async()=>{
 const queries=[];const db={prepare(sql){assert.ok(!forbidden.test(sql),sql);queries.push(sql);return{bind(){return this},async first(){return{names:'["fixture model"]'}},async all(){return{results:[]}}}},async batch(){throw Error('Schema batch must not run')}};
 const load=loader({DB:db});
 assert.equal((await load('lib/server/business-models.ts').businessModelNames(db,1))[0],'fixture model');
 await load('lib/server/business-albums.ts').listPublicBusinessAlbums(db,1,'premium',[1]);
 await load('lib/server/campaigns.ts').publicCampaigns(db,'fixture');
 assert.ok(queries.length>=3);
});
test('Migration and conditional media-column plan preserve existing records and are repeat safe',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('db/schema.sql','utf8'));db.exec(readFileSync('db/migrations/0007_business_albums.sql','utf8'));
 db.exec("INSERT INTO businesses(id,name,slug,status,city) VALUES(1,'Existing booth','existing','published','Test'); INSERT INTO business_media(business_id,kind,storage_key) VALUES(1,'image','existing-key')");
 const before=db.prepare('SELECT id,business_id,kind,storage_key FROM business_media').all();
 for(let pass=0;pass<2;pass++){
  const statements=planMediaColumns(db.prepare('PRAGMA table_info(business_media)').all().map(c=>c.name));
  if(pass===1)assert.equal(statements.length,0);
  for(const sql of statements)db.exec(sql);
  db.exec(readFileSync('db/migrations/0022_cpu_runtime_tables.sql','utf8'));
 }
 assert.deepEqual(db.prepare('SELECT id,business_id,kind,storage_key FROM business_media').all(),before);
 assert.equal(db.prepare('SELECT name FROM businesses WHERE id=1').get().name,'Existing booth');
 assert.equal(db.prepare('PRAGMA quick_check').get().quick_check,'ok');db.close();
});
