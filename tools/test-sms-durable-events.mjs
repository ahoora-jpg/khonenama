import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

function fixture(){
 const sql=new DatabaseSync(':memory:');
 for(const file of ['0012_sms_center.sql','0013_sms_acquisition.sql','0014_sms_removals.sql','0018_sms_durable_events.sql'])sql.exec(readFileSync('db/migrations/'+file,'utf8'));
 sql.exec('CREATE TABLE users(id TEXT PRIMARY KEY,phone TEXT);CREATE TABLE businesses(id INTEGER PRIMARY KEY,owner_user_id TEXT,status TEXT);CREATE TABLE lead_recipients(lead_id INTEGER,business_id INTEGER,unlocked_at TEXT,PRIMARY KEY(lead_id,business_id));');
 sql.exec(readFileSync('db/migrations/0019_sms_lead_access_events.sql','utf8'));
 const db={prepare(query){return{query,values:[],bind(...v){this.values=v;return this;},async first(){return sql.prepare(query).get(...this.values)||null;},async all(){return{results:sql.prepare(query).all(...this.values)};},async run(){return{meta:{changes:sql.prepare(query).run(...this.values).changes}};}};},async batch(statements){sql.exec('BEGIN');try{const result=statements.map(s=>({meta:{changes:sql.prepare(s.query).run(...s.values).changes}}));sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const logs=[],env={DB:db,SMS_BRIDGE_TOKEN:'test-bridge-secret',SMS_LIVE_SEND_ENABLED:'true',SMS_SIM_MODE:'default'},cache=new Map();
 const load=file=>{file=resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(source,{exports,require:name=>name==='cloudflare:workers'?{env}:name==='@/lib/server/sms/admin-auth'?{isSmsAdminRequest:async r=>r.headers.get('authorization')==='Bearer test-admin'}:load((name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(file),name))+'.ts'),crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Date,Request,Response,Headers,URL,AbortSignal,console:{log:x=>logs.push(x),warn:x=>logs.push(x)}});return exports;};
 const core=load('lib/server/sms/acquisition.ts'),events=load('lib/server/sms/events.ts'),consumer=load('lib/server/sms/event-consumer.ts'),apply=load('lib/server/sms/acquisition-events.ts'),wrapper=load('lib/server/sms/worker-bridge.ts'),bridge=load('lib/server/sms/bridge.ts');
 sql.exec("INSERT INTO sms_contacts(id,tenant_id,phone_e164,display_name,source) VALUES('c','khonenama','+989123456789','Test','mock');INSERT INTO sms_campaigns(id,tenant_id,name,body,max_recipients) VALUES('ca','khonenama','Test','Test',1);INSERT INTO sms_recipient_links(id,tenant_id,campaign_id,contact_id,token,destination) VALUES('link','khonenama','ca','c','"+'a'.repeat(40)+"','/register-business');UPDATE sms_gateways SET enabled=1,inbound_enabled=1;UPDATE sms_gateway_agents SET enabled=1,last_inbox_at=CURRENT_TIMESTAMP;");
 const accepted=[],dead=[],archive=new Map(),queue={send:async event=>{accepted.push(structuredClone(event));}},dlq={send:async event=>{dead.push(structuredClone(event));}},bucket={put:async(k,v)=>{archive.set(k,v);},get:async k=>archive.has(k)?{json:async()=>JSON.parse(archive.get(k))}:null,list:async()=>({objects:[...archive.keys()].map(key=>({key,uploaded:new Date()}))})};
 const request=(key,session)=>new Request('https://khonenama.ir/s/'+'a'.repeat(40),{headers:{'user-agent':'Mozilla/5.0','x-request-id':key,...(session?{cookie:'kn_sms_visit='+session}:{})}});
 const message=(body,attempts=1)=>({body,attempts,acked:false,delays:[],ack(){this.acked=true;},retry(v){this.delays.push(v.delaySeconds);}});
 const applyEvent=(event,marker,lease)=>apply.applyAcquisitionEvent(db,event,marker,lease);
 const consume=(messages,extra={})=>consumer.consumeSmsEvents({messages},{DB:db,SMS_EVENTS_DLQ:dlq,SMS_EVENT_ARCHIVE:bucket,...extra},applyEvent);
 const session=r=>r.headers.get('set-cookie').match(/kn_sms_visit=([a-f0-9]{40})/)[1];
 const agent=(input,protocol='1')=>new Request('https://khonenama.ir/api/v1/sms/bridge',{method:'POST',headers:{authorization:'Bearer '+env.SMS_BRIDGE_TOKEN,'content-type':'application/json','x-sms-event-protocol':protocol},body:JSON.stringify(input)});
 return{sql,db,env,logs,load,core,events,consumer,apply,wrapper,bridge,accepted,dead,archive,queue,dlq,bucket,request,message,consume,session,agent,close:()=>sql.close()};
}

test('click and page view are durably accepted, projected and deduplicated without losing real repeat clicks',async()=>{const f=fixture();try{
 const r=await f.core.handleAcquisitionLink(f.request('click-one'),f.db,{queue:f.queue});assert.equal(r.status,302);assert.equal(f.accepted.length,1);assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_click_totals').get().n,0);
 const session=f.session(r),m=f.message(f.accepted[0]);await f.consume([m]);assert.equal(m.acked,true);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
 await f.consume([f.message(f.accepted[0],2)]);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
 await f.core.handleAcquisitionLink(f.request('click-two',session),f.db,{queue:f.queue});await f.consume([f.message(f.accepted[1])]);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,2);assert.equal(f.sql.prepare("SELECT count(*) n FROM sms_link_events WHERE kind='click'").get().n,1);
 await f.core.recordAcquisitionStage(f.db,f.request('view-one',session),'registration_view',{queue:f.queue});const view=f.accepted.at(-1);await f.consume([f.message(view)]);await f.consume([f.message(view,2)]);assert.equal(f.sql.prepare("SELECT count(*) n FROM sms_link_events WHERE kind='registration_view'").get().n,1);
}finally{f.close();}});

test('database outage at acceptance and consumption preserves the click until recovery',async()=>{const f=fixture();try{
 const offline={prepare(){throw Error('D1_ERROR: database temporarily unavailable');}};
 const r=await f.core.handleAcquisitionLink(f.request('db-outage'),offline,{queue:f.queue});assert.equal(r.status,302);assert.equal(f.accepted.length,1);
 const m=f.message(f.accepted[0]);await f.consume([m],{DB:offline});assert.equal(m.acked,false);assert.deepEqual(m.delays,[15]);
 const recovered=f.message(f.accepted[0],2);await f.consume([recovered]);assert.equal(recovered.acked,true);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
}finally{f.close();}});

test('queue outage falls back to a durable D1 outbox; a total storage outage never claims acceptance',async()=>{const f=fixture();try{
 const down={send:async()=>{throw Error('Queue temporarily unavailable');}};
 const r=await f.core.handleAcquisitionLink(f.request('queue-outage'),f.db,{queue:down});assert.equal(r.status,302);assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_event_outbox WHERE queued_at IS NULL').get().n,1);
 assert.equal(await f.consumer.drainSmsOutbox(f.db,f.queue),1);await f.consume([f.message(f.accepted[0])]);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
 const failed=await f.core.handleAcquisitionLink(f.request('all-storage-down'),{prepare(){throw Error('D1_ERROR: offline');}},{queue:down});assert.equal(failed.status,503);assert.equal((await failed.json()).error,'EVENT_NOT_ACCEPTED');assert.equal(failed.headers.has('location'),false);
}finally{f.close();}});

test('external service failures retry effects without incrementing analytics twice',async()=>{const f=fixture();try{
 await f.core.handleAcquisitionLink(f.request('sink-case'),f.db,{queue:f.queue});const event=f.accepted[0],seen=new Set();let calls=0;
 const sink={fetch:async request=>{calls++;seen.add(request.headers.get('idempotency-key'));return new Response(null,{status:calls===1?503:204});}};
 const first=f.message(event);await f.consume([first],{SMS_EVENT_SINK:sink});assert.equal(first.acked,false);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
 const second=f.message(event,2);await f.consume([second],{SMS_EVENT_SINK:sink});assert.equal(second.acked,true);assert.equal(seen.size,1);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);assert.equal(f.sql.prepare('SELECT state FROM sms_event_receipts').get().state,'done');
}finally{f.close();}});

test('permanent errors and exhausted retries remain inspectable in receipts, private archive and DLQ',async()=>{const f=fixture();try{
 await f.core.handleAcquisitionLink(f.request('permanent-case'),f.db,{queue:f.queue});const m=f.message(f.accepted[0]);await f.consume([m],{SMS_EVENT_SINK:{fetch:async()=>new Response(null,{status:400})}});assert.equal(m.acked,true);assert.equal(f.dead.length,1);assert.equal(f.archive.size,1);assert.equal(f.sql.prepare('SELECT state FROM sms_event_receipts').get().state,'failed');assert.ok(f.sql.prepare('SELECT payload_json FROM sms_event_receipts').get().payload_json.includes('permanent-case'));
 const e=await f.events.makeSmsEvent('stage',{session:'b'.repeat(40),kind:'registration_view'},'no-session');const exhausted=f.message(e,6);await f.consume([exhausted]);assert.equal(exhausted.acked,true);assert.equal(f.dead.length,2);
}finally{f.close();}});

test('link lock/unlock and customer-to-business access are recorded atomically and remain on queue outage',async()=>{const f=fixture();try{
 f.sql.exec("UPDATE sms_recipient_links SET active=0;UPDATE sms_recipient_links SET active=0;UPDATE sms_recipient_links SET active=1;INSERT INTO lead_recipients VALUES(10,20,NULL);UPDATE lead_recipients SET unlocked_at=CURRENT_TIMESTAMP;UPDATE lead_recipients SET unlocked_at=CURRENT_TIMESTAMP;UPDATE lead_recipients SET unlocked_at=NULL;");
 assert.equal(f.sql.prepare("SELECT count(*) n FROM sms_access_state_events WHERE scope='link'").get().n,3);assert.equal(f.sql.prepare("SELECT count(*) n FROM sms_access_state_events WHERE scope='lead'").get().n,3);
 assert.equal(await f.consumer.drainAccessEvents(f.db,{send:async()=>{throw Error('offline');}}),0);assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_access_state_events WHERE queued_at IS NULL').get().n,6);
 assert.equal(await f.consumer.drainAccessEvents(f.db,f.queue),6);await f.consume(f.accepted.map(e=>f.message(e)));assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_access_state_events WHERE processed_at IS NOT NULL').get().n,6);assert.equal(await f.consumer.drainAccessEvents(f.db,f.queue),0);
}finally{f.close();}});

test('concurrent duplicate deliveries acquire one lease and count a click exactly once',async()=>{const f=fixture();try{
 await f.core.handleAcquisitionLink(f.request('parallel-case'),f.db,{queue:f.queue});await f.consume(Array.from({length:20},()=>f.message(f.accepted[0])));assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);assert.equal(f.sql.prepare("SELECT count(*) n FROM sms_event_receipts WHERE state='done'").get().n,1);
}finally{f.close();}});

test('idempotency conflict is retained separately without overwriting the original event',async()=>{const f=fixture();try{
 await f.core.handleAcquisitionLink(f.request('collision'),f.db,{queue:f.queue});const original=f.accepted[0];await f.consume([f.message(original)]);
 const altered=structuredClone(original);altered.payload.session='f'.repeat(40);const m=f.message(altered,2);await f.consume([m]);assert.equal(m.acked,true);assert.equal(f.dead.at(-1).reason,'IDEMPOTENCY_CONFLICT');assert.equal(f.sql.prepare('SELECT state FROM sms_event_receipts').get().state,'done');assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
}finally{f.close();}});

test('normal asynchronous bridge pressure accepts 100 reports without D1 reads or 503 responses',async()=>{const f=fixture();try{
 const db={prepare(){throw Error('D1 quota should not be on the async response path');}};
 const responses=await Promise.all(Array.from({length:100},(_,i)=>f.wrapper.handleWorkerBridge(f.agent({action:'report',messageId:'message-'+i,leaseToken:'lease-'+i,gatewayMessageId:'gateway-'+i,gatewayState:'Delivered'}),db,{queue:f.queue})));
 assert.ok(responses.every(r=>r.status===202));assert.equal(f.accepted.length,100);assert.ok((await responses[0].json()).accepted);
 const bad=await f.wrapper.handleWorkerBridge(new Request(f.agent({action:'report'}),{headers:{authorization:'Bearer invalid'}}),db,{queue:f.queue});assert.equal(bad.status,401);
 assert.equal((await f.wrapper.handleWorkerBridge(f.agent({action:'report'}),db,{queue:f.queue})).status,400);
 const limited=await f.wrapper.handleWorkerBridge(f.agent({action:'heartbeat'}),f.db,{rateLimiter:{limit:async()=>({success:false})}});assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'60');
}finally{f.close();}});

test('legacy bridge response stays compatible; database failures get a safe cause and backoff',async()=>{const f=fixture();try{
 const legacy=await f.wrapper.handleWorkerBridge(f.agent({action:'heartbeat'},'0'),f.db);assert.equal(legacy.status,200);assert.equal((await legacy.json()).ok,true);
 const bad={prepare(){throw Error('D1_ERROR: Your account has exceeded D1 daily row read limit +989123456789 Bearer secret');}};
 const failed=await f.wrapper.handleWorkerBridge(f.agent({action:'heartbeat'},'0'),bad);assert.equal(failed.status,503);assert.equal(failed.headers.get('x-sms-error-class'),'D1_QUOTA');assert.equal(failed.headers.get('retry-after'),'300');
 const text=f.logs.join('\n');assert.ok(text.includes('D1_QUOTA'));assert.ok(!text.includes('+989123456789'));assert.ok(!text.includes('Bearer secret'));assert.ok(!text.includes('test-bridge-secret'));
}finally{f.close();}});

test('bridge reports atomically retain the transition, event and attempt and survive a duplicate',async()=>{const f=fixture();try{
 f.sql.exec("INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,expires_at,lease_token,attempts) VALUES('message','khonenama','c','promotional','mock','leased','message',datetime('now','+1 day'),'lease',1)");
 const input={action:'report',messageId:'message',leaseToken:'lease',gatewayMessageId:'gateway',gatewayState:'Delivered'};
 const first=await f.bridge.handleBridge(f.agent(input,'0'));assert.equal(first.status,200);const duplicate=await f.bridge.handleBridge(f.agent(input,'0'));assert.equal(duplicate.status,200);
 assert.equal(f.sql.prepare('SELECT status FROM sms_messages').get().status,'delivered');assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_message_events').get().n,1);assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_delivery_attempts').get().n,1);
}finally{f.close();}});

test('agent HTTP retries are bounded, respect Retry-After, and never retry a queue claim',async()=>{
 const {bridgeRequest}=await import('../tools/sms-bridge/agent.mjs');const waits=[];let calls=0;const config={siteUrl:'https://khonenama.ir',bridgeToken:'test',simNumber:'default',durableEvents:true};
 const result=await bridgeRequest(config,'report',{messageId:'m'},{sleep:async ms=>waits.push(ms),fetch:async(_url,request)=>{calls++;assert.equal(request.headers['x-sms-event-protocol'],'1');return calls===1?Response.json({error:'BRIDGE_UNAVAILABLE'},{status:503,headers:{'Retry-After':'30'}}):Response.json({ok:true,accepted:true},{status:202});}});assert.equal(result.accepted,true);assert.equal(calls,2);assert.deepEqual(waits,[30000]);
 calls=0;await assert.rejects(bridgeRequest(config,'claim',{}, {sleep:async()=>{},fetch:async()=>{calls++;return Response.json({error:'BRIDGE_UNAVAILABLE'},{status:503});}}));assert.equal(calls,1);
 calls=0;await assert.rejects(bridgeRequest(config,'report',{}, {sleep:async()=>{},fetch:async()=>{calls++;return Response.json({error:'REPORT_CONFLICT'},{status:409});}}));assert.equal(calls,1);
});

test('conversion survives background retries and retains account and booth attribution',async()=>{const f=fixture();try{
 const r=await f.core.handleAcquisitionLink(f.request('conversion-click'),f.db,{queue:f.queue});await f.consume([f.message(f.accepted[0])]);
 f.sql.exec("INSERT INTO users VALUES('user','+989123456789');INSERT INTO businesses VALUES(1,'user','published')");
 await f.core.recordAcquisitionConversion(f.db,f.request('conversion',f.session(r)),{userId:'user',businessId:1,phone:'+989123456789',newAccount:true,published:true,complete:true},{queue:f.queue});
 const event=f.accepted.at(-1);await f.consume([f.message(event)]);await f.consume([f.message(event,2)]);
 assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_acquisition_conversions').get().n,4);assert.equal(f.sql.prepare("SELECT count(*) n FROM sms_acquisition_conversions WHERE last_link_id='link' AND identity_match=1").get().n,4);
}finally{f.close();}});

test('a projection transaction failure rolls back counters and retries safely',async()=>{const f=fixture();try{
 await f.core.handleAcquisitionLink(f.request('atomic-failure'),f.db,{queue:f.queue});
 f.sql.exec("CREATE TRIGGER injected_failure BEFORE INSERT ON sms_link_events BEGIN SELECT RAISE(ABORT,'D1_ERROR: temporarily unavailable'); END;");
 const event=f.accepted[0],m=f.message(event);await f.consume([m]);assert.equal(m.acked,false);assert.equal(f.sql.prepare('SELECT count(*) n FROM sms_click_totals').get().n,0);
 f.sql.exec('DROP TRIGGER injected_failure');await f.consume([f.message(event,2)]);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);
}finally{f.close();}});

test('admin inspection and replay require authorization and preserve the original event identity',async()=>{const f=fixture();try{
 f.env.SMS_EVENTS=f.queue;f.env.SMS_EVENT_ARCHIVE=f.bucket;const api=f.load('app/api/admin/sms/events/route.ts');
 assert.equal((await api.GET(new Request('https://sms.khonenama.ir/api/admin/sms/events'))).status,401);
 await f.core.handleAcquisitionLink(f.request('replay-case'),f.db,{queue:f.queue});const event=f.accepted[0];await f.consume([f.message(event)],{SMS_EVENT_SINK:{fetch:async()=>new Response(null,{status:400})}});
 const headers={authorization:'Bearer test-admin','content-type':'application/json',origin:'https://sms.khonenama.ir'};
 const list=await api.GET(new Request('https://sms.khonenama.ir/api/admin/sms/events',{headers}));const data=await list.json();assert.equal(data.events[0].id,event.id);assert.equal(JSON.stringify(data).includes('+989123456789'),false);
 assert.equal((await api.POST(new Request('https://sms.khonenama.ir/api/admin/sms/events',{method:'POST',headers:{...headers,origin:'https://attacker.invalid'},body:JSON.stringify({action:'replay',id:event.id})}))).status,403);
 const replay=await api.POST(new Request('https://sms.khonenama.ir/api/admin/sms/events',{method:'POST',headers,body:JSON.stringify({action:'replay',id:event.id})}));assert.equal(replay.status,202);assert.equal(await f.consumer.drainSmsOutbox(f.db,f.queue),1);assert.equal(f.accepted.at(-1).id,event.id);
 await f.consume([f.message(f.accepted.at(-1))]);assert.equal(f.sql.prepare('SELECT total FROM sms_click_totals').get().total,1);assert.equal(f.sql.prepare('SELECT state FROM sms_event_receipts').get().state,'done');
}finally{f.close();}});

test('agent cycle backoff is bounded and permanent errors cannot create a tight loop',async()=>{
 const {bridgeBackoff}=await import('../tools/sms-bridge/agent.mjs');assert.equal(bridgeBackoff(1),15000);assert.equal(bridgeBackoff(3),60000);assert.equal(bridgeBackoff(100),300000);assert.equal(bridgeBackoff(1,true),300000);
});
