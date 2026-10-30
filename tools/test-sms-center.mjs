import test from "node:test";
import assert from "node:assert/strict";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {DatabaseSync} from "node:sqlite";
import ts from "typescript";
import vm from "node:vm";
import {normalizePhone,isOptOut,canTransition,gatewayState,canReceivePromotionalMessage} from "../lib/server/sms/domain.ts";
import {CLAIM_SQL} from "../lib/server/sms/queue.ts";
import {routeSmsHost} from "../lib/server/sms/host.ts";
const schemaExports={},acqSchemaExports={};
vm.runInNewContext(ts.transpileModule(await readFile("lib/server/sms/acquisition-schema.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:acqSchemaExports});
vm.runInNewContext(ts.transpileModule(await readFile("lib/server/sms/schema.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:schemaExports,require:()=>acqSchemaExports});
const {ensureSmsSchema}=schemaExports;

test("Worker binding initializes additive schema once with sending disabled",async()=>{
  const sqlite=new DatabaseSync(':memory:');let batches=0;
  const db={prepare:q=>({sql:q,all:async()=>({results:sqlite.prepare(q).all()})}),batch:async statements=>{batches++;sqlite.exec('BEGIN');try{for(const q of statements)sqlite.exec(q.sql);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
  await Promise.all([ensureSmsSchema(db),ensureSmsSchema(db)]);
  assert.equal(batches,1);
  assert.equal(sqlite.prepare("SELECT enabled FROM sms_gateways").get().enabled,0);
  assert.equal(sqlite.prepare("SELECT enabled FROM sms_gateway_agents").get().enabled,0);
  sqlite.close();
});

test("SMS subdomain maps its home and rejects unrelated site routes",()=>{
  for(const page of ["send","contacts","groups","campaigns","templates","inbox","history","reports","gateway","settings"]){
    const url="https://sms.khonenama.ir/sms/"+page;
    assert.equal(routeSmsHost(new Request(url)).url,url);
  }
  assert.equal(routeSmsHost(new Request("https://sms.khonenama.ir/sms/not-a-page")).status,404);
  const alias=routeSmsHost(new Request("https://www.sms.khonenama.ir/login?return=sms"));
  assert.equal(alias.status,308);
  assert.equal(alias.headers.get("location"),"https://sms.khonenama.ir/login?return=sms");
  const aliasHttp=routeSmsHost(new Request("http://www.sms.khonenama.ir/"));
  assert.equal(aliasHttp.headers.get("location"),"https://sms.khonenama.ir/");
  const home=routeSmsHost(new Request("https://sms.khonenama.ir/"));
  assert.equal(home instanceof Request,true);
  assert.equal(new URL(home.url).pathname,"/sms");
  const login=routeSmsHost(new Request("https://sms.khonenama.ir/login"));
  assert.equal(new URL(login.url).pathname,"/sms/login");
  assert.equal(routeSmsHost(new Request("https://sms.khonenama.ir/business/example")).status,404);
  assert.equal(routeSmsHost(new Request("https://sms.khonenama.ir/api/v1/sms/bridge")).url,"https://sms.khonenama.ir/api/v1/sms/bridge");
  assert.equal(routeSmsHost(new Request("https://sms.khonenama.ir/robots.txt")).status,200);
  assert.equal(routeSmsHost(new Request("https://sms.khonenama.ir/api/admin/sms")).url,"https://sms.khonenama.ir/api/admin/sms");
  assert.equal(routeSmsHost(new Request("https://khonenama.ir/business/example")).url,"https://khonenama.ir/business/example");
});

test("Iranian phone normalization and rejection",()=>{
  assert.equal(normalizePhone("۰۹۱۲ ۳۴۵ ۶۷۸۹"),"+989123456789");
  assert.equal(normalizePhone("00989123456789"),"+989123456789");
  assert.equal(normalizePhone("+989123456789"),"+989123456789");
  assert.equal(normalizePhone("091234"),null);
});
test("opt-out and state transitions",()=>{
  assert.equal(isOptOut(" لغو "),true);
  assert.equal(isOptOut("STOP"),true);
  assert.equal(isOptOut("شروع"),false);
  assert.equal(canTransition("queued","leased"),true);
  assert.equal(canTransition("queued","delivered"),false);
  assert.equal(canTransition("unknown","sent"),true);
  assert.equal(gatewayState("Processed"),"processed");
});
test("migration constraints and tenant uniqueness",async()=>{
  const sql=await readFile(new URL("../db/migrations/0012_sms_center.sql",import.meta.url),"utf8");
  const db=new DatabaseSync(":memory:");
  db.exec(sql);
  assert.equal(db.prepare("SELECT sim_number,enabled FROM sms_gateways WHERE id='khonenama-android'").get().sim_number,2);
  assert.equal(db.prepare("SELECT enabled FROM sms_gateways WHERE id='khonenama-android'").get().enabled,0);
  assert.throws(()=>db.prepare("UPDATE sms_gateways SET sim_number=1").run());
  db.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c1','khonenama','+989123456789','test')").run();
  assert.throws(()=>db.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c2','khonenama','+989123456789','test')").run());
  db.close();
});
test("promotional recipients need no initial consent and are suppressed after opt-out",async()=>{
  const sql=await readFile(new URL("../db/migrations/0012_sms_center.sql",import.meta.url),"utf8");
  const sqlite=new DatabaseSync(":memory:");sqlite.exec(sql);
  sqlite.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c1','khonenama','+989123456789','csv_import')").run();
  const db={prepare:(query)=>({bind:(...params)=>({first:async()=>sqlite.prepare(query).get(...params)})})};
  assert.equal(await canReceivePromotionalMessage(db,"c1"),true);
  sqlite.prepare("INSERT INTO sms_consents(id,tenant_id,contact_id,status,method,text_version,evidence_ref) VALUES('s1','khonenama','c1','granted','form','v1','record-1')").run();
  assert.equal(await canReceivePromotionalMessage(db,"c1"),true);
  sqlite.prepare("INSERT INTO sms_opt_outs(tenant_id,contact_id,source) VALUES('khonenama','c1','inbound_sms')").run();
  assert.equal(await canReceivePromotionalMessage(db,"c1"),false);
  sqlite.close();
});
test("dispatch prioritizes transactional messages and rechecks opt-out",async()=>{
  const sqlite=new DatabaseSync(":memory:");sqlite.exec(await readFile(new URL("../db/migrations/0012_sms_center.sql",import.meta.url),"utf8"));
  sqlite.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c1','khonenama','+989123456789','test'),('c2','khonenama','+989111111111','test')").run();
  const insert=sqlite.prepare(`INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,priority,idempotency_key,expires_at)
    VALUES(?,'khonenama',?,?,?,'queued',?,?,datetime('now','+1 day'))`);
  insert.run("p1","c1","promotional","تبلیغ",0,"p1");
  insert.run("t1","c2","transactional","رسید",10,"t1");
  const claim=sqlite.prepare(CLAIM_SQL);
  assert.equal(claim.get("lease1","khonenama","khonenama-android","-15 seconds").id,"t1");
  sqlite.prepare("UPDATE sms_messages SET status='sent',updated_at=datetime('now','-16 seconds') WHERE id='t1'").run();
  assert.equal(claim.get("lease2","khonenama","khonenama-android","-15 seconds"),undefined);
  sqlite.prepare("INSERT INTO sms_consents(id,tenant_id,contact_id,status,method,text_version,evidence_ref) VALUES('s1','khonenama','c1','granted','form','v1','e1')").run();
  sqlite.prepare("INSERT INTO sms_opt_outs(tenant_id,contact_id,source) VALUES('khonenama','c1','STOP')").run();
  assert.equal(claim.get("lease3","khonenama","khonenama-android","-15 seconds"),undefined);
  sqlite.prepare("DELETE FROM sms_opt_outs").run();
  assert.equal(claim.get("lease4","khonenama","khonenama-android","-15 seconds"),undefined);
  sqlite.prepare("UPDATE sms_gateways SET inbound_enabled=1 WHERE id='khonenama-android'").run();
  assert.equal(claim.get("lease5","khonenama","khonenama-android","-15 seconds"),undefined);
  sqlite.prepare("UPDATE sms_gateway_agents SET last_inbox_at=CURRENT_TIMESTAMP WHERE id='khonenama-windows'").run();
  assert.equal(claim.get("lease6","khonenama","khonenama-android","-15 seconds").id,"p1");
  sqlite.close();
});
test("expired and abandoned jobs are reconciled without resending",async()=>{
  const sqlite=new DatabaseSync(":memory:");sqlite.exec(await readFile(new URL("../db/migrations/0012_sms_center.sql",import.meta.url),"utf8"));
  sqlite.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c1','khonenama','+989123456789','test')").run();
  sqlite.prepare(`INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,expires_at,lease_until)
    VALUES('q','khonenama','c1','transactional','old','queued','q',datetime('now','-1 minute'),NULL),
          ('l','khonenama','c1','transactional','uncertain','leased','l',datetime('now','+1 day'),datetime('now','-1 minute'))`).run();
  const db={prepare:query=>({bind:(...params)=>({all:async()=>({results:sqlite.prepare(query).all(...params)}),run:async()=>sqlite.prepare(query).run(...params),first:async()=>sqlite.prepare(query).get(...params)})})};
  const module={exports:{}};
  const source=await readFile(new URL("../lib/server/sms/reconcile.ts",import.meta.url),"utf8");
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {module,exports:module.exports,require:()=>({TENANT:"khonenama"}),crypto});
  await module.exports.reconcileSms(db);
  assert.equal(sqlite.prepare("SELECT status FROM sms_messages WHERE id='q'").get().status,"failed");
  assert.equal(sqlite.prepare("SELECT status FROM sms_messages WHERE id='l'").get().status,"unknown");
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sms_messages WHERE status='queued'").get().n,0);
  sqlite.close();
});
test("idempotency and tenant boundaries are enforced by persistence",async()=>{
  const sqlite=new DatabaseSync(":memory:");sqlite.exec(await readFile(new URL("../db/migrations/0012_sms_center.sql",import.meta.url),"utf8"));
  sqlite.prepare("INSERT INTO sms_tenants(id,name) VALUES('other','Other')").run();
  sqlite.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c1','khonenama','+989123456789','test'),('c2','other','+989123456789','test')").run();
  const insert=sqlite.prepare(`INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,expires_at)
    VALUES(?,'khonenama','c1','transactional','test','queued','same',datetime('now','+1 day'))`);
  insert.run("m1");assert.throws(()=>insert.run("m2"));
  const db={prepare:query=>({bind:(...params)=>({first:async()=>sqlite.prepare(query).get(...params)})})};
  assert.equal(await canReceivePromotionalMessage(db,"c2"),false);
  sqlite.close();
});
test("bridge payload forces SIM 2 and reconciles uncertain outcome",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"sms-bridge-test-"));
  process.env.SMS_BRIDGE_JOURNAL=join(dir,"journal.json");
  try {
    const {gatewayPayload,processJob,validateConfig}=await import("./sms-bridge/agent.mjs");
    const config={siteUrl:"https://example.org",phoneUrl:"http://192.168.1.5:8080",sendPath:"/message",statusPath:"/message/{id}",bridgeToken:"test",phoneUser:"sms",phonePassword:"test",simNumber:2};
    const job={id:"message-1",gatewayId:"message-1",phone:"+989123456789",body:"آزمون شبیه‌سازی",simNumber:2,expiresAt:new Date(Date.now()+60000).toISOString(),leaseToken:"lease"};
    assert.equal(gatewayPayload(job).simNumber,2);
    assert.throws(()=>gatewayPayload({...job,simNumber:1}));
    assert.throws(()=>validateConfig({...config,siteUrl:"https://example.org"}));
    assert.throws(()=>validateConfig({...config,siteUrl:"https://khonenama.ir",phoneUrl:"http://192.168.1.5@evil.example"}));
    const calls=[];
    const previous=globalThis.fetch;
    globalThis.fetch=async(url,options)=>{
      calls.push({url:String(url),method:options.method,body:options.body&&JSON.parse(options.body)});
      if(String(url).endsWith("/message") && options.method==="POST") throw Error("connection lost after submission");
      if(String(url).endsWith("/message/message-1")) return new Response(JSON.stringify({id:"message-1",state:"Sent"}),{status:200});
      if(String(url).endsWith("/api/v1/sms/bridge") && JSON.parse(options.body).action==="authorize") return new Response(JSON.stringify({ok:true,allowed:true}),{status:200});
      return new Response(JSON.stringify({ok:true}),{status:200});
    };
    try{await processJob(config,job,{});}finally{globalThis.fetch=previous;}
    assert.equal(calls.filter(c=>c.method==="POST"&&c.url.endsWith("/message")).length,1);
    assert.equal(calls.find(c=>c.url.endsWith("/message")).body.simNumber,2);
    assert.equal(calls.find(c=>c.url.endsWith("/api/v1/sms/bridge")&&c.body.gatewayState).body.gatewayState,"Sent");
  }finally{await rm(dir,{recursive:true,force:true});}
});
test("late opt-out authorization denial prevents phone submission",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"sms-bridge-deny-"));
  process.env.SMS_BRIDGE_JOURNAL=join(dir,"journal.json");
  try{
    const {processJob}=await import("./sms-bridge/agent.mjs?deny");
    const config={siteUrl:"https://khonenama.ir",phoneUrl:"http://192.168.1.5:8080",sendPath:"/message",statusPath:"/message/{id}",bridgeToken:"test",phoneUser:"sms",phonePassword:"test",simNumber:2};
    const job={id:"m2",gatewayId:"m2",phone:"+989123456789",body:"تبلیغ",simNumber:2,expiresAt:new Date(Date.now()+60000).toISOString(),leaseToken:"lease"};
    let phoneCalls=0;const previous=globalThis.fetch;
    globalThis.fetch=async(url,options)=>{if(String(url).endsWith("/message"))phoneCalls++;const input=JSON.parse(options.body);return new Response(JSON.stringify(input.action==="authorize"?{ok:true,allowed:false}:{ok:true}),{status:200});};
    try{await processJob(config,job,{});}finally{globalThis.fetch=previous;}
    assert.equal(phoneCalls,0);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('Windows bridge interprets D1 expiry as UTC and respects installed gateway minimum TTL',async()=>{
  const {parseExpiry,gatewayPayload}=await import('./sms-bridge/agent.mjs');
  const prior=process.env.TZ;
  try{process.env.TZ='Asia/Tehran';assert.equal(parseExpiry('2030-01-02 03:04:05'),Date.parse('2030-01-02T03:04:05Z'));assert.equal(parseExpiry('2030-01-02T03:04:05+03:30'),Date.parse('2030-01-02T03:04:05+03:30'));assert.ok(Number.isNaN(parseExpiry('invalid')));const payload=gatewayPayload({simNumber:2,gatewayId:'test',phone:'+989123456789',body:'mock',expiresAt:new Date(Date.now()+1000).toISOString()});assert.equal(payload.simNumber,2);assert.equal(payload.ttl,5);}finally{if(prior===undefined)delete process.env.TZ;else process.env.TZ=prior;}
});

test('bridge retries only safe preflight reads, never a potentially claimed or submitted operation',async()=>{
 const {bridgeRequest}=await import('./sms-bridge/agent.mjs');const original=globalThis.fetch;let calls=0;
 try{
  globalThis.fetch=async()=>{calls++;if(calls===1)throw new DOMException('mock timeout','TimeoutError');return new Response('{"ok":true}',{status:200});};
  assert.equal((await bridgeRequest({siteUrl:'https://khonenama.ir',bridgeToken:'mock'},'authorize',{messageId:'test'})).ok,true);assert.equal(calls,2);
  calls=0;globalThis.fetch=async()=>{calls++;throw new DOMException('mock timeout','TimeoutError');};
  await assert.rejects(()=>bridgeRequest({siteUrl:'https://khonenama.ir',bridgeToken:'mock'},'claim'));assert.equal(calls,1);
 }finally{globalThis.fetch=original;}
});

test('bridge accepts the dedicated SMS origin and rejects lookalike or untrusted hosts',async()=>{
 const {validateConfig}=await import('./sms-bridge/agent.mjs');
 const config={siteUrl:'https://sms.khonenama.ir',phoneUrl:'http://192.168.43.1:8080',sendPath:'/messages',statusPath:'/messages/{id}',bridgeToken:'mock',phoneUser:'mock',phonePassword:'mock',simNumber:'default'};
 assert.equal(validateConfig(config).siteUrl,'https://sms.khonenama.ir');
 assert.throws(()=>validateConfig({...config,siteUrl:'https://sms.khonenama.ir.attacker.invalid'}));
 assert.throws(()=>validateConfig({...config,siteUrl:'http://sms.khonenama.ir'}));
});

test('large future queues use the due-time index and preserve timezone-aware claim semantics',async()=>{
 const db=new DatabaseSync(':memory:');db.exec(await readFile('db/migrations/0012_sms_center.sql','utf8'));db.exec(await readFile('db/migrations/0017_sms_due_queue_index.sql','utf8'));
 db.exec("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('due-test','khonenama','+989123456789','test')");
 const insert=db.prepare("INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,scheduled_at,expires_at) VALUES(?,'khonenama','due-test','transactional','mock','queued',?,?,datetime('now','+3 days'))");
 db.exec('BEGIN');for(let i=0;i<11000;i++)insert.run('future-'+i,'future-'+i,new Date(Date.now()+86400000).toISOString());db.exec('COMMIT');
 insert.run('due-null','due-null',null);insert.run('due-utc','due-utc',new Date(Date.now()-60000).toISOString());
 const offset=new Date(Date.now()-60000+3.5*3600000).toISOString().replace('Z','+03:30');insert.run('due-tehran','due-tehran',offset);
 const plan=db.prepare('EXPLAIN QUERY PLAN '+CLAIM_SQL).all('lease','khonenama','khonenama-android','-15 seconds').map(r=>r.detail).join('\n');
 assert.match(plan,/idx_sms_due_dispatch/);assert.match(plan,/<expr></);
 const seen=[];for(let i=0;i<3;i++){const row=db.prepare(CLAIM_SQL).get('lease-'+i,'khonenama','khonenama-android','-15 seconds');assert.ok(row);seen.push(row.id);db.prepare("UPDATE sms_messages SET updated_at=datetime('now','-1 minute') WHERE id=?").run(row.id);}
 assert.deepEqual(seen.sort(),['due-null','due-tehran','due-utc'].sort());assert.equal(db.prepare(CLAIM_SQL).get('last','khonenama','khonenama-android','-15 seconds'),undefined);
 assert.equal(db.prepare("SELECT count(*) n FROM sms_messages WHERE id LIKE 'future-%' AND attempts=0 AND status='queued'").get().n,11000);db.close();
});
