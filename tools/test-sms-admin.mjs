import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

function load(file,imports={}){
  const exports={};
  const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>{if(name.endsWith('/dispatch-control'))return load('lib/server/sms/dispatch-control.ts',{'./domain':{TENANT:'khonenama'}});if(name.endsWith('/campaign-preview'))return load('lib/server/sms/campaign-preview.ts',{'./domain':{TENANT:'khonenama'},'../../sms-text':load('lib/sms-text.ts'),'./acquisition':imports['@/lib/server/sms/acquisition']||imports['./acquisition']});assert.ok(name in imports,name);return imports[name];},crypto:webcrypto,TextEncoder,TextDecoder,Uint8Array,Date,URL,Request,Response,Headers,btoa,console,setTimeout});
  return exports;
}
async function fixture(){
  const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('db/migrations/0012_sms_center.sql','utf8'));sql.exec(readFileSync('db/migrations/0013_sms_acquisition.sql','utf8'));sql.exec(readFileSync('db/migrations/0014_sms_removals.sql','utf8'));sql.exec('CREATE TABLE users(id TEXT PRIMARY KEY,phone TEXT);CREATE TABLE businesses(id INTEGER PRIMARY KEY,owner_user_id TEXT,status TEXT)');
  const db={prepare(query){return{values:[],bind(...values){this.values=values;return this;},async first(){return sql.prepare(query).get(...this.values)||null;},async all(){return{results:sql.prepare(query).all(...this.values)};},async run(){return{meta:{changes:sql.prepare(query).run(...this.values).changes}};}};}};
  db.batch=async statements=>{sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}};
  const env={DB:db,ADMIN_ACCESS_KEY:'test-site-key-only',SMS_BRIDGE_TOKEN:'test-bridge-key-only'};
  const admin=load('lib/server/admin-session.ts',{'cloudflare:workers':{env}});
  const auth=load('lib/server/sms/admin-auth.ts',{'cloudflare:workers':{env},'@/lib/server/admin-session':admin});
  const domain=load('lib/server/sms/domain.ts'),config=load('lib/server/sms/config.ts');
  const events=load('lib/server/sms/events.ts');
  const queuedAcquisition=load('lib/server/sms/queued-acquisition.ts',{'./events':events});
  const acquisition=load('lib/server/sms/acquisition.ts',{'./domain':domain,'../../sms-text':load('lib/sms-text.ts'),'./events':events,'./queued-acquisition':queuedAcquisition});
  const contactImport=load('lib/server/sms/contact-import.ts',{'./domain':domain});
  const imports={'./events':events,'@/lib/server/sms/contact-import':contactImport,'@/lib/server/sms/acquisition':acquisition,'cloudflare:workers':{env},'@/lib/server/admin-session':admin,'@/lib/server/sms/admin-auth':auth,'@/lib/server/sms/domain':domain,'@/lib/server/sms/config':config};
  const cookie=(await admin.createAdminCookie()).split(';')[0];
  const request=(body,cookies=cookie)=>new Request('https://sms.khonenama.ir/api/admin/sms',{method:'POST',headers:{cookie:cookies,origin:'https://sms.khonenama.ir','content-type':'application/json'},body:JSON.stringify(body)});
  const get=(path,cookies=cookie)=>new Request('https://sms.khonenama.ir'+path,{headers:{cookie:cookies}});
  return{sql,db,env,admin,auth,domain,config,imports,cookie,request,get};
}
test('11000 named recipients import in bulk with no truncation, duplicates or messages',async()=>{
 const f=await fixture();try{const csv=load('lib/sms-csv.ts'),api=load('app/api/admin/sms/campaigns/route.ts',f.imports),group=await(await api.POST(f.request({action:'group',name:'11000'}))).json();const parsed=csv.csvImportBatches('Phone,نام فروشگاه,نام و نام خانوادگی,شهرستان\n'+Array.from({length:11000},(_,i)=>'0912'+String(i).padStart(7,'0')+',فروشگاه '+i+',نام '+i+',اصفهان').join('\n'));assert.equal(parsed.rows,11000);assert.equal(parsed.batches.length,110);let batchCalls=0;const original=f.db.batch;f.db.batch=async statements=>{batchCalls++;assert.equal(statements.length,4);return original(statements);};const result=await csv.importCsvBatches(parsed.batches,group.id,async payload=>{assert.ok(Buffer.byteLength(JSON.stringify(payload))<65536);const r=await api.POST(f.request(payload));assert.equal(r.status,200);return r.json();},()=>{});assert.equal(result.imported,11000);assert.equal(batchCalls,110);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contacts').get().n,11000);assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM sms_contacts WHERE trim(display_name)=''").get().n,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_group_members').get().n,11000);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_campaigns').get().n,0);const workspace=load('app/api/admin/sms/workspace/route.ts',f.imports);const last=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=groups&id='+group.id+'&page=220'))).json();assert.equal(last.members.length,50);assert.equal(last.groups[0].member_count,11000);}finally{f.sql.close();}
});
test('Persian names are preserved, blanks skipped and alternate phone formats deduplicated',()=>{
 const csv=load('lib/sms-csv.ts'),r=csv.csvImportBatches('Phone,نام فروشگاه,نام و نام خانوادگی,شهرستان\n09123456789,پرده سرای قصر,روح اله دشتی,اصفهان\n+989123456789,قصر,,اصفهان\n09123456788,,,اصفهان\n09123456787,,علی رضایی,اصفهان');assert.equal(r.rows,2);assert.equal(r.duplicates,1);assert.equal(r.unnamed,1);assert.ok(r.records[0].name.includes('پرده سرای قصر'));assert.ok(r.records[0].name.includes('روح اله دشتی'));assert.equal(r.records[1].name,'علی رضایی');assert.equal(r.records[0].city,'اصفهان');
});
test('existing unnamed contacts receive their supplied names and temporary failures retry with checkpoints',async()=>{
 const f=await fixture();try{f.sql.exec("INSERT INTO sms_contacts(id,tenant_id,phone_e164,display_name,source) VALUES('unnamed','khonenama','+989123456789','','test')");const csv=load('lib/sms-csv.ts'),api=load('app/api/admin/sms/campaigns/route.ts',f.imports),g=await(await api.POST(f.request({action:'group',name:'repair'}))).json(),parsed=csv.csvImportBatches('Phone,Name\n09123456789,نام واقعی');let calls=0,checkpoint=0;const result=await csv.importCsvBatches(parsed.batches,g.id,async p=>{if(++calls===1)throw Object.assign(Error('temporary'),{status:503});return(await api.POST(f.request(p))).json();},()=>{},{delay:async()=>{},onCheckpoint:next=>checkpoint=next});assert.equal(calls,2);assert.equal(checkpoint,1);assert.equal(result.imported,1);assert.equal(f.sql.prepare("SELECT display_name FROM sms_contacts WHERE id='unnamed'").get().display_name,'نام واقعی');assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contacts').get().n,1);let skipped=0;await csv.importCsvBatches(parsed.batches,g.id,async()=>{skipped++;throw Error('should skip committed batch');},()=>{},{startAt:1});assert.equal(skipped,0);}finally{f.sql.close();}
});
test('a single 500-row CSV imports completely in bounded batches without messages or duplicate contacts',async()=>{
 const f=await fixture();try{const csv=load('lib/sms-csv.ts'),api=load('app/api/admin/sms/campaigns/route.ts',f.imports);const group=await(await api.POST(f.request({action:'group',name:'CSV 500'}))).json();const content='\uFEFFphone,name,city\r\n'+Array.from({length:500},(_,i)=>'0912'+String(i).padStart(7,'0')+',test,Tehran').join('\r\n');const parsed=csv.csvImportBatches(content);assert.equal(parsed.rows,500);assert.ok(parsed.batches.length>1);let progress=0;const submit=async p=>{assert.ok(Buffer.byteLength(JSON.stringify(p))<65536);const r=await api.POST(f.request(p));assert.equal(r.status,200);return r.json();};const result=await csv.importCsvBatches(parsed.batches,group.id,submit,n=>{assert.ok(n>=progress);progress=n;});assert.equal(result.imported,500);assert.equal(result.invalid,0);assert.equal(progress,500);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contacts').get().n,500);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_group_members').get().n,500);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contact_profiles').get().n,500);await csv.importCsvBatches(parsed.batches,group.id,submit,()=>{});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contacts').get().n,500);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_group_members').get().n,500);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_campaigns').get().n,0);}finally{f.sql.close();}
});
test('CSV handles semicolons, quoted newlines and names with quotes, and rejects invalid or oversized files',async()=>{
 const csv=load('lib/sms-csv.ts');const reordered=csv.csvImportBatches('phone,city,name\n09123456789,Tehran,Test');assert.ok(reordered.batches[0].includes('"+989123456789","Test","Tehran"'));const parsed=csv.csvImportBatches('\uFEFFphone;name\r\n09123456789;"نام\n\"\"دوم\"\""');assert.equal(parsed.rows,1);assert.ok(parsed.batches[0].includes('نام\n""دوم""'));assert.throws(()=>csv.csvImportBatches('unknown_column,name\n09123456789,test'));assert.throws(()=>csv.csvImportBatches('phone,name\n09123456789,"unfinished'));assert.throws(()=>csv.csvImportBatches('phone,name\n'));assert.throws(()=>csv.csvImportBatches('phone,name\n'+Array.from({length:50001},()=>'+989123456789,test').join('\n')));assert.throws(()=>csv.csvImportBatches('x'.repeat(20_000_001)));
});
test('interrupted CSV import can be resumed by reimporting without duplicate members',async()=>{
 const f=await fixture();try{const csv=load('lib/sms-csv.ts'),api=load('app/api/admin/sms/campaigns/route.ts',f.imports),g=await(await api.POST(f.request({action:'group',name:'retry CSV'}))).json();const parsed=csv.csvImportBatches('phone,name\n'+Array.from({length:217},(_,i)=>'0912'+String(i).padStart(7,'0')+',test').join('\n'));let calls=0;const submit=async p=>(await api.POST(f.request(p))).json();await assert.rejects(()=>csv.importCsvBatches(parsed.batches,g.id,p=>{if(++calls===2)throw Object.assign(Error('mock authentication failure'),{status:401});return submit(p);},()=>{}));assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contacts').get().n,100);await csv.importCsvBatches(parsed.batches,g.id,submit,()=>{});assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_group_members').get().n,217);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);}finally{f.sql.close();}
});
test('tracking campaigns append recipient links automatically to both plain-text variants',async()=>{
 const f=await fixture();try{const api=load('app/api/admin/sms/campaigns/route.ts',f.imports);const g=await(await api.POST(f.request({action:'group',name:'automatic links'}))).json();const r=await api.POST(f.request({action:'create',name:'automatic',body:'سلام، غرفه بسازید',variantB:'نسخه دوم ساده',tracking:true,groupId:g.id,maxRecipients:500}));assert.equal(r.status,200);const row=f.sql.prepare('SELECT body FROM sms_campaigns').get();const options=f.sql.prepare('SELECT variant_b FROM sms_campaign_options').get();assert.equal(row.body.split('{{registration_link}}').length-1,1);assert.equal(options.variant_b.split('{{registration_link}}').length-1,1);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);}finally{f.sql.close();}
});
test('contact deletion erases recipient data, cancels pending messages and blocks reimport',async()=>{
 const f=await fixture();try{f.env.SMS_LIVE_SEND_ENABLED='true';const api=load('app/api/admin/sms/route.ts',f.imports);const c=await(await api.POST(f.request({action:'contact',phone:'09123456789',name:'Private name'}))).json();await api.POST(f.request({action:'queue',contactId:c.id,category:'promotional',body:'Private text',idempotencyKey:'delete-me',expiresAt:new Date(Date.now()+86400000).toISOString()}));const r=await api.POST(f.request({action:'removeContact',id:c.id}));assert.equal(r.status,200);const contact=f.sql.prepare('SELECT * FROM sms_contacts WHERE id=?').get(c.id);assert.equal(contact.source,'removed');assert.equal(contact.display_name,'');assert.ok(!contact.phone_e164.includes('9123456789'));assert.equal(f.sql.prepare('SELECT status FROM sms_messages').get().status,'cancelled');assert.ok(!f.sql.prepare('SELECT body FROM sms_messages').get().body.includes('Private'));assert.equal(await f.domain.canReceivePromotionalMessage(f.db,c.id),false);assert.equal((await api.POST(f.request({action:'contact',phone:'09123456789'}))).status,409);const workspace=load('app/api/admin/sms/workspace/route.ts',f.imports);assert.equal((await(await workspace.GET(f.get('/api/admin/sms/workspace?view=contacts'))).json()).total,0);const marker=f.sql.prepare('SELECT phone_hash FROM sms_removed_records').get();assert.equal(marker.phone_hash.length,64);assert.ok(!marker.phone_hash.includes('+989'));}finally{f.sql.close();}
});
test('contact deletion refuses a leased message and leaves the phone unchanged',async()=>{
 const f=await fixture();try{const api=load('app/api/admin/sms/route.ts',f.imports);const c=await(await api.POST(f.request({action:'contact',phone:'09123456789'}))).json();f.sql.prepare("INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,expires_at) VALUES('leased','khonenama',?,'promotional','mock','leased','leased-key',datetime('now','+1 day'))").run(c.id);assert.equal((await api.POST(f.request({action:'removeContact',id:c.id}))).status,409);assert.equal(f.sql.prepare('SELECT phone_e164 FROM sms_contacts').get().phone_e164,'+989123456789');assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_removed_records').get().n,0);}finally{f.sql.close();}
});
test('campaign removal hides it and cancels pending work without deleting message history',async()=>{
 const f=await fixture();try{const api=load('app/api/admin/sms/campaigns/route.ts',f.imports);const g=await(await api.POST(f.request({action:'group',name:'delete campaign'}))).json();const c=await(await api.POST(f.request({action:'create',name:'remove this',body:'mock',groupId:g.id,maxRecipients:1}))).json();f.sql.exec("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('recipient','khonenama','+989123456789','test')");f.sql.prepare("INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,campaign_id,expires_at) VALUES('m','khonenama','recipient','promotional','mock','queued','m-key',?,datetime('now','+1 day'))").run(c.id);assert.equal((await api.POST(f.request({action:'remove',id:c.id}))).status,200);assert.equal((await(await api.GET(f.get('/api/admin/sms/campaigns'))).json()).campaigns.length,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,1);assert.equal(f.sql.prepare('SELECT status FROM sms_messages').get().status,'cancelled');}finally{f.sql.close();}
});
test('deletion requires the administrator and cannot remove another tenant contact',async()=>{
 const f=await fixture();try{const api=load('app/api/admin/sms/route.ts',f.imports);assert.equal((await api.POST(f.request({action:'removeContact',id:'x'},''))).status,401);f.sql.exec("INSERT INTO sms_tenants VALUES('other','other',1);INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('foreign','other','+989123456789','test')");assert.equal((await api.POST(f.request({action:'removeContact',id:'foreign'}))).status,404);assert.equal(f.sql.prepare("SELECT phone_e164 FROM sms_contacts WHERE id='foreign'").get().phone_e164,'+989123456789');}finally{f.sql.close();}
});

test('existing site role works without an extra key; configured extra keys and CSRF checks remain enforced',async()=>{
  const f=await fixture();try{
    assert.equal(await f.auth.isSmsAdminRequest(f.get('/api/admin/sms','')),false);
    assert.equal(await f.auth.isSmsAdminRequest(f.get('/api/admin/sms')),true);
    const crossSite=new Request('https://sms.khonenama.ir/api/admin/sms',{method:'POST',headers:{cookie:f.cookie,origin:'https://attacker.invalid'}});
    assert.equal(await f.auth.isSmsAdminRequest(crossSite),false);
    f.env.SMS_ADMIN_ACCESS_KEY='test-extra-sms-key';
    assert.equal(await f.auth.isSmsAdminRequest(f.get('/api/admin/sms')),false);
    const smsCookie=(await f.auth.createSmsCookie()).split(';')[0];
    assert.equal(await f.auth.isSmsAdminRequest(f.get('/api/admin/sms',f.cookie+'; '+smsCookie)),true);
    f.env.SMS_ADMIN_ACCESS_KEY='rotated-test-extra-key';
    assert.equal(await f.auth.isSmsAdminRequest(f.get('/api/admin/sms',f.cookie+'; '+smsCookie)),false);
  }finally{f.sql.close();}
});

test('session reports the actual login step and logout clears both host-only sessions',async()=>{
  const f=await fixture();try{
    const session=load('app/api/admin/sms/session/route.ts',f.imports);
    assert.equal((await session.GET(f.get('/api/admin/sms/session',''))).status,401);
    const body=await(await session.GET(f.get('/api/admin/sms/session'))).json();
    assert.equal(body.authenticated,true);assert.equal(body.keyRequired,false);assert.equal(body.liveSendingEnabled,false);
    const logout=load('app/api/admin/sms/logout/route.ts',f.imports);
    const response=await logout.POST(f.request({}));
    assert.equal(response.headers.getSetCookie().length,2);
    assert.ok(response.headers.getSetCookie().every(value=>value.includes('Max-Age=0')&&value.includes('HttpOnly')&&!value.includes('Domain=')));
  }finally{f.sql.close();}
});

test('review mode saves idempotent drafts and exposes masked recipients only',async()=>{
  const f=await fixture();try{
    const route=load('app/api/admin/sms/route.ts',f.imports);
    assert.equal((await route.POST(f.request({action:'contact'},''))).status,401);
    const contact=await(await route.POST(f.request({action:'contact',phone:'09123456789',name:'Test',kind:'seller'}))).json();
    const input={action:'queue',contactId:contact.id,category:'transactional',reason:'test receipt',body:'test draft',idempotencyKey:'draft-once',expiresAt:new Date(Date.now()+86400000).toISOString()};
    const first=await(await route.POST(f.request(input))).json();
    assert.equal(first.status,'draft');
    assert.equal(f.sql.prepare('SELECT status FROM sms_messages WHERE id=?').get(first.id).status,'draft');
    const repeated=await(await route.POST(f.request(input))).json();assert.equal(repeated.id,first.id);
    assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_message_events').get().n,1);
    f.env.SMS_LIVE_SEND_ENABLED='true';
    const replay=await(await route.POST(f.request(input))).json();assert.equal(replay.status,'draft','retry cannot promote an existing draft');
    const denied=await route.POST(f.request({...input,category:'promotional',idempotencyKey:'promotional-live'}));assert.equal(denied.status,200);
    delete f.env.SMS_LIVE_SEND_ENABLED;
    const promotional=await(await route.POST(f.request({...input,category:'promotional',idempotencyKey:'promotional-draft'}))).json();assert.equal(promotional.status,'draft');
    const data=await(await route.GET(f.get('/api/admin/sms'))).json();
    assert.equal(data.messages.length,3);assert.ok(data.messages.every(message=>!message.phone_e164.includes('9123456789')));
  }finally{f.sql.close();}
});

test('review mode blocks campaign approval, template activation and bridge dispatch at the server',async()=>{
  const f=await fixture();try{
    const campaigns=load('app/api/admin/sms/campaigns/route.ts',f.imports);
    const group=await(await campaigns.POST(f.request({action:'group',name:'test group'}))).json();
    const campaign=await(await campaigns.POST(f.request({action:'create',name:'draft campaign',body:'test content',groupId:group.id,maxRecipients:1}))).json();
    assert.equal((await campaigns.POST(f.request({action:'approve',id:campaign.id}))).status,403);
    assert.equal(f.sql.prepare('SELECT status FROM sms_campaigns').get().status,'draft');
    const templates=load('app/api/admin/sms/templates/route.ts',f.imports);
    assert.equal((await templates.POST(f.request({code:'quote_received',category:'transactional',body:'Request {{leadId}}'}))).status,200);
    assert.equal((await templates.POST(f.request({action:'toggle',code:'quote_received',confirm:'ENABLE'}))).status,403);
    assert.equal(f.sql.prepare('SELECT enabled FROM sms_templates').get().enabled,0);
    f.sql.exec('UPDATE sms_gateways SET enabled=1;UPDATE sms_gateway_agents SET enabled=1;');
    const bridge=load('lib/server/sms/bridge.ts',{'cloudflare:workers':{env:f.env},'./domain':f.domain,'./config':f.config,'./acquisition':f.imports['@/lib/server/sms/acquisition'],'./queue':{CLAIM_SQL:'FORBIDDEN_DISPATCH_SQL'}});
    for(const action of ['claim','authorize']){
      const request=new Request('https://khonenama.ir/api/v1/sms/bridge',{method:'POST',headers:{authorization:'Bearer '+f.env.SMS_BRIDGE_TOKEN,'content-type':'application/json'},body:JSON.stringify({action})});
      const response=await bridge.handleBridge(request);assert.equal(response.status,403);assert.equal((await response.json()).error,'LIVE_SEND_DISABLED');
    }
  }finally{f.sql.close();}
});

test('SMS estimates count Unicode surrogate pairs and GSM extension characters correctly',()=>{
  const {estimateSms}=load('lib/sms-text.ts');
  assert.equal(estimateSms('س'.repeat(70)).parts,1);
  assert.equal(estimateSms('س'.repeat(71)).parts,2);
  assert.equal(estimateSms('😀'.repeat(36)).parts,2);
  assert.equal(estimateSms('^'.repeat(81)).parts,2);
  assert.equal(estimateSms('').parts,0);
});

test('review-mode cron never expands even an already-approved campaign',async()=>{
  const f=await fixture();try{
    f.sql.exec("INSERT INTO sms_contact_groups(id,tenant_id,name) VALUES('g','khonenama','group');INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c','khonenama','+989123456789','test');INSERT INTO sms_group_members(tenant_id,group_id,contact_id) VALUES('khonenama','g','c');INSERT INTO sms_consents(id,tenant_id,contact_id,status,method,text_version,evidence_ref) VALUES('s','khonenama','c','granted','form','v1','test-evidence');INSERT INTO sms_campaigns(id,tenant_id,name,body,group_id,status,max_recipients) VALUES('campaign','khonenama','test','test','g','approved',1);UPDATE sms_gateways SET enabled=1,inbound_enabled=1;UPDATE sms_gateway_agents SET enabled=1,last_inbox_at=CURRENT_TIMESTAMP;");
    const {reconcileSms}=load('lib/server/sms/reconcile.ts',{'./domain':f.domain,'./acquisition':f.imports['@/lib/server/sms/acquisition']});
    await reconcileSms(f.db,{liveSendingEnabled:false});
    assert.equal(f.sql.prepare('SELECT status FROM sms_campaigns').get().status,'approved');
    assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);
  }finally{f.sql.close();}
});

test('workspace contacts use real pagination, consent suppression, masked numbers and tenant isolation',async()=>{
  const f=await fixture();try{
    const workspace=load('app/api/admin/sms/workspace/route.ts',f.imports);
    assert.equal((await workspace.GET(f.get('/api/admin/sms/workspace?view=contacts',''))).status,401);
    f.sql.exec("INSERT INTO sms_tenants(id,name) VALUES('other','Other');INSERT INTO sms_contacts(id,tenant_id,phone_e164,display_name,kind,source) VALUES('foreign','other','+989100000000','private foreign','other','test')");
    const insert=f.sql.prepare("INSERT INTO sms_contacts(id,tenant_id,phone_e164,display_name,source) VALUES(?,'khonenama',?,?,'test')");
    for(let i=0;i<25;i++)insert.run('contact-'+i,'+98912'+String(i).padStart(7,'0'),'person '+i);
    f.sql.exec("INSERT INTO sms_consents(id,tenant_id,contact_id,status,method,text_version,evidence_ref) VALUES('consent','khonenama','contact-0','granted','form','v1','proof');INSERT INTO sms_opt_outs(tenant_id,contact_id,source) VALUES('khonenama','contact-0','inbound')");
    const first=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=contacts'))).json();
    assert.equal(first.total,25);assert.equal(first.items.length,20);assert.ok(first.items.every(c=>c.phone_e164.includes('••••••')));
    const second=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=contacts&page=2'))).json();assert.equal(second.items.length,5);assert.ok(!second.items.some(c=>first.items.some(d=>d.id===c.id)));
    const revoked=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=contacts&filter=revoked'))).json();assert.equal(revoked.total,1);assert.equal(revoked.items[0].id,'contact-0');
    const foreign=await workspace.GET(f.get('/api/admin/sms/workspace?view=contact&id=foreign'));assert.equal(foreign.status,404);
    const injection=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=contacts&q='+encodeURIComponent("' OR 1=1 --")))).json();assert.equal(injection.total,0);
    assert.equal((await workspace.GET(f.get('/api/admin/sms/workspace?view=not-a-view'))).status,400);
  }finally{f.sql.close();}
});

test('contact editing keeps recipient identity and consent intact; duplicate creation reports existing identity',async()=>{
  const f=await fixture();try{
    const route=load('app/api/admin/sms/route.ts',f.imports);
    const first=await(await route.POST(f.request({action:'contact',phone:'09123456789',name:'original',kind:'customer'}))).json();
    const again=await(await route.POST(f.request({action:'contact',phone:'09123456789',name:'replacement',kind:'seller'}))).json();assert.equal(again.id,first.id);assert.equal(again.duplicate,true);
    const result=await route.POST(f.request({action:'editContact',id:first.id,name:'renamed',kind:'seller',phone:'09120000000'}));assert.equal(result.status,200);
    const row=f.sql.prepare('SELECT * FROM sms_contacts WHERE id=?').get(first.id);assert.equal(row.display_name,'renamed');assert.equal(row.kind,'seller');assert.equal(row.phone_e164,'+989123456789');
    assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_consents').get().n,0);
    assert.equal((await route.POST(f.request({action:'editContact',id:first.id,name:'cross-site',kind:'other'},''))).status,401);
    assert.equal((await route.POST(f.request({action:'editContact',id:'absent',name:'no',kind:'other'}))).status,404);
    assert.equal((await route.POST(f.request({action:'editContact',id:first.id,name:'no',kind:'owner'}))).status,400);
  }finally{f.sql.close();}
});

test('group summaries and membership changes preserve consent and enforce tenant boundaries',async()=>{
  const f=await fixture();try{
    const workspace=load('app/api/admin/sms/workspace/route.ts',f.imports),campaign=load('app/api/admin/sms/campaigns/route.ts',f.imports);
    f.sql.exec("INSERT INTO sms_tenants(id,name) VALUES('other','Other');INSERT INTO sms_contact_groups(id,tenant_id,name) VALUES('g','khonenama','group'),('foreign','other','private');INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c','khonenama','+989123456789','test');INSERT INTO sms_group_members(tenant_id,group_id,contact_id) VALUES('khonenama','g','c');INSERT INTO sms_consents(id,tenant_id,contact_id,status,method,text_version,evidence_ref) VALUES('s','khonenama','c','granted','form','v1','proof')");
    const groups=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=groups&id=g'))).json();assert.equal(groups.groups.length,1);assert.equal(groups.groups[0].eligible_count,1);assert.equal(groups.members.length,1);assert.ok(groups.members[0].phone_e164.includes('••••••'));
    assert.equal((await campaign.POST(f.request({action:'renameGroup',groupId:'foreign',name:'bad'}))).status,404);
    assert.equal((await campaign.POST(f.request({action:'renameGroup',groupId:'g',name:'renamed'}))).status,200);
    assert.equal((await campaign.POST(f.request({action:'removeMember',groupId:'g',contactId:'c'}))).status,200);
    assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_group_members').get().n,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_consents').get().n,1);
    assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM sms_audit_logs WHERE action IN ('renameGroup','removeMember')").get().n,2);
  }finally{f.sql.close();}
});

test('reports are date-scoped, retain distinct message states, and never manufacture delivery data',async()=>{
  const f=await fixture();try{
    const workspace=load('app/api/admin/sms/workspace/route.ts',f.imports);
    f.sql.exec("INSERT INTO sms_contacts(id,tenant_id,phone_e164,source) VALUES('c','khonenama','+989123456789','test');INSERT INTO sms_messages(id,tenant_id,contact_id,category,body,status,idempotency_key,expires_at,created_at) VALUES('m1','khonenama','c','transactional','test','submitted','k1','2030-01-01','2026-10-01 10:00:00'),('m2','khonenama','c','promotional','test','draft','k2','2030-01-01','2026-10-02 10:00:00'),('old','khonenama','c','transactional','old','delivered','k3','2030-01-01','2026-09-01 10:00:00')");
    const report=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=reports&from=2026-10-01&to=2026-10-02'))).json();assert.equal(report.daily.length,2);assert.equal(report.outcomes.find(s=>s.status==='submitted').count,1);assert.ok(!report.outcomes.some(s=>s.status==='delivered'));assert.equal(report.categories.length,2);assert.equal(report.optouts,0);
    assert.equal((await workspace.GET(f.get('/api/admin/sms/workspace?view=reports&from=2026-10-03&to=2026-10-02'))).status,400);
    assert.equal((await workspace.GET(f.get('/api/admin/sms/workspace?view=reports&from=2020-01-01&to=2026-10-02'))).status,400);
    const messages=await(await workspace.GET(f.get('/api/admin/sms/workspace?view=history&filter=submitted'))).json();assert.equal(messages.total,1);assert.equal(messages.items[0].status,'submitted');assert.ok(messages.items[0].phone_e164.includes('••••••'));
    const root=load('app/api/admin/sms/route.ts',f.imports);const dashboard=await(await root.GET(f.get('/api/admin/sms'))).json();assert.equal(dashboard.summary.active_campaigns,0);
  }finally{f.sql.close();}
});

test('UI bridge status never reports online from configuration or future heartbeat alone',()=>{
  const ui=load('lib/sms-admin-ui.ts');const now=Date.parse('2026-10-27T10:00:00Z');
  assert.equal(ui.bridgeState(null,now),'unknown');
  assert.equal(ui.bridgeState({enabled:1,gateway_enabled:1,last_seen_at:null},now),'unknown');
  assert.equal(ui.bridgeState({enabled:0,gateway_enabled:1,last_seen_at:'2026-10-27 09:59:59'},now),'disabled');
  assert.equal(ui.bridgeState({enabled:1,gateway_enabled:1,last_seen_at:'2026-10-27T09:59:59Z'},now),'online');
  assert.equal(ui.bridgeState({enabled:1,gateway_enabled:1,last_seen_at:'2026-10-27 09:55:00'},now),'offline');
  assert.equal(ui.bridgeState({enabled:1,gateway_enabled:1,last_seen_at:'2026-10-28 09:55:00'},now),'offline');
  assert.equal(ui.bridgeState({enabled:1,gateway_enabled:1,last_seen_at:'invalid'},now),'offline');
});

test('authorized live mode queues messages without initial consent and preserves optional drafts',async()=>{
  const f=await fixture();try{
    f.env.SMS_LIVE_SEND_ENABLED='true';
    const route=load('app/api/admin/sms/route.ts',f.imports);
    const contact=await(await route.POST(f.request({action:'contact',phone:'09123456789',kind:'customer'}))).json();
    const input={action:'queue',contactId:contact.id,body:'authorized local test only',reason:'test',category:'transactional',expiresAt:new Date(Date.now()+3600000).toISOString(),idempotencyKey:'live-queue'};
    const queued=await(await route.POST(f.request(input))).json();assert.equal(queued.status,'queued');
    const draft=await(await route.POST(f.request({...input,draftOnly:true,category:'promotional',idempotencyKey:'explicit-draft'}))).json();assert.equal(draft.status,'draft');
    assert.equal((await route.POST(f.request({...input,category:'promotional',idempotencyKey:'no-consent'}))).status,200);
    assert.equal(f.sql.prepare("SELECT COUNT(*) n FROM sms_messages WHERE status='queued'").get().n,2);
    const repeated=await(await route.POST(f.request({...input,idempotencyKey:'explicit-draft',category:'promotional'}))).json();
    assert.notEqual(repeated.status,'queued','a draft cannot be promoted by replaying its key');
  }finally{f.sql.close();}
});

test('default SIM mode omits simNumber at the phone and requires matching server and agent modes',async()=>{
 const f=await fixture();try{
  f.env.SMS_SIM_MODE='default';f.env.SMS_LIVE_SEND_ENABLED='true';
  const route=load('app/api/admin/sms/route.ts',f.imports);
  const person=await(await route.POST(f.request({action:'contact',phone:'09123456789',name:'local test',kind:'admin'}))).json();
  await route.POST(f.request({action:'queue',contactId:person.id,body:'mock only',reason:'test',category:'transactional',expiresAt:new Date(Date.now()+3600000).toISOString(),idempotencyKey:'default-sim-test'}));
  f.sql.exec('UPDATE sms_gateways SET enabled=1;UPDATE sms_gateway_agents SET enabled=1');
  const queue=load('lib/server/sms/queue.ts');
  const bridge=load('lib/server/sms/bridge.ts',{'cloudflare:workers':{env:f.env},'./domain':f.domain,'./acquisition':f.imports['@/lib/server/sms/acquisition'],'./queue':queue,'./config':f.config});
  const request=mode=>new Request('https://khonenama.ir/api/v1/sms/bridge',{method:'POST',headers:{authorization:'Bearer '+f.env.SMS_BRIDGE_TOKEN,'content-type':'application/json'},body:JSON.stringify({action:'claim',simNumber:mode})});
  assert.equal((await bridge.handleBridge(request(2))).status,409);
  const claimed=await(await bridge.handleBridge(request('default'))).json();assert.equal(claimed.job.simNumber,'default');
  const {gatewayPayload,validateConfig}=await import('./sms-bridge/agent.mjs');
  const payload=gatewayPayload(claimed.job);assert.ok(!Object.hasOwn(payload,'simNumber'));assert.equal(payload.phoneNumbers.length,1);
  const legacy=gatewayPayload({...claimed.job,simNumber:2});assert.equal(legacy.simNumber,2);
  assert.throws(()=>gatewayPayload({...claimed.job,simNumber:1}));
  assert.equal(f.config.smsSimSelection({SMS_SIM_MODE:'typo'}),null);
  const dashboard=await(await route.GET(f.get('/api/admin/sms'))).json();assert.equal(dashboard.agent.sim_selection,'default');
  assert.equal(validateConfig({siteUrl:'https://khonenama.ir',phoneUrl:'http://192.168.43.1:8080',sendPath:'/messages',statusPath:'/messages/{id}',bridgeToken:'mock',phoneUser:'mock',phonePassword:'mock',simNumber:'default'}).simNumber,'default');
 }finally{f.sql.close();}
});

test('Worker machine route preserves authentication, origin and body limits before invoking the SMS engine',async()=>{
 const f=await fixture();try{
  const queue=load('lib/server/sms/queue.ts');const bridge=load('lib/server/sms/bridge.ts',{'cloudflare:workers':{env:f.env},'./domain':f.domain,'./acquisition':f.imports['@/lib/server/sms/acquisition'],'./queue':queue,'./config':f.config});
  const security=load('lib/request-security.ts');let schemaCalls=0;
  const handler=load('lib/server/sms/worker-bridge.ts',{'./bridge':bridge,'./schema':{ensureSmsSchema:async()=>{schemaCalls++;}},'../../request-security':security,'./events':f.imports['./events']});
  const make=(body,extra={})=>new Request('https://khonenama.ir/api/v1/sms/bridge',{method:'POST',headers:{authorization:'Bearer '+f.env.SMS_BRIDGE_TOKEN,'content-type':'application/json',...extra},body});
  assert.equal((await handler.handleWorkerBridge(new Request('https://khonenama.ir/api/v1/sms/bridge',{method:'POST',body:'{}'}),f.db)).status,401);assert.equal(schemaCalls,0);
  assert.equal((await handler.handleWorkerBridge(make('{}',{origin:'https://attacker.invalid'}),f.db)).status,403);
  assert.equal((await handler.handleWorkerBridge(make('x'.repeat(65537)),f.db)).status,413);
  f.sql.exec('UPDATE sms_gateways SET enabled=1;UPDATE sms_gateway_agents SET enabled=1');
  const response=await handler.handleWorkerBridge(make(JSON.stringify({action:'heartbeat'})),f.db);assert.equal(response.status,200);assert.equal((await response.json()).ok,true);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(schemaCalls,1);
 }finally{f.sql.close();}
});

test('campaigns expand imported numbers without initial consent while opt-outs remain excluded at every stage',async()=>{
 const f=await fixture();try{
  f.env.SMS_LIVE_SEND_ENABLED='true';
  const api=load('app/api/admin/sms/route.ts',f.imports),campaigns=load('app/api/admin/sms/campaigns/route.ts',f.imports);
  const group=await(await campaigns.POST(f.request({action:'group',name:'audience'}))).json();
  const imported=await(await campaigns.POST(f.request({action:'importCsv',groupId:group.id,csv:'phone,name\n09123456789,first\n09123456788,second\n09123456787,excluded\n09123456789,duplicate'}))).json();
  assert.equal(imported.imported,4);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_contacts').get().n,3);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_consents').get().n,0);
  const excluded=f.sql.prepare("SELECT id FROM sms_contacts WHERE phone_e164='+989123456787'").get().id;
  f.sql.prepare("INSERT INTO sms_opt_outs(tenant_id,contact_id,source) VALUES('khonenama',?,'inbound_sms')").run(excluded);
  const campaign=await(await campaigns.POST(f.request({action:'create',groupId:group.id,name:'campaign',body:'mock campaign',maxRecipients:10}))).json();
  assert.equal((await campaigns.POST(f.request({action:'approve',id:campaign.id}))).status,200);
  f.sql.exec('UPDATE sms_gateways SET enabled=1,inbound_enabled=1;UPDATE sms_gateway_agents SET enabled=1,last_inbox_at=CURRENT_TIMESTAMP');
  const reconcile=load('lib/server/sms/reconcile.ts',{'./domain':f.domain,'./acquisition':f.imports['@/lib/server/sms/acquisition']});
  await reconcile.reconcileSms(f.db,{liveSendingEnabled:true});await reconcile.reconcileSms(f.db,{liveSendingEnabled:true});
  assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_campaign_recipients').get().n,2);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,2);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages WHERE contact_id=?').get(excluded).n,0);
  const data=await(await campaigns.GET(f.get('/api/admin/sms/campaigns'))).json();assert.equal(data.campaigns[0].eligible_count,2);
  const bridge=load('lib/server/sms/bridge.ts',{'cloudflare:workers':{env:f.env},'./domain':f.domain,'./acquisition':f.imports['@/lib/server/sms/acquisition'],'./queue':load('lib/server/sms/queue.ts'),'./config':f.config});
  const request=payload=>new Request('https://sms.khonenama.ir/api/v1/sms/bridge',{method:'POST',headers:{authorization:'Bearer '+f.env.SMS_BRIDGE_TOKEN,'content-type':'application/json'},body:JSON.stringify(payload)});
  const {job}=await(await bridge.handleBridge(request({action:'claim',simNumber:2}))).json();assert.ok(job);
  assert.equal((await(await bridge.handleBridge(request({action:'authorize',messageId:job.id,leaseToken:job.leaseToken}))).json()).allowed,true);
  const leasedContact=f.sql.prepare('SELECT contact_id FROM sms_messages WHERE id=?').get(job.id).contact_id;
  f.sql.prepare("INSERT INTO sms_opt_outs(tenant_id,contact_id,source) VALUES('khonenama',?,'inbound_sms')").run(leasedContact);
  assert.equal((await(await bridge.handleBridge(request({action:'authorize',messageId:job.id,leaseToken:job.leaseToken}))).json()).allowed,false);
  f.sql.prepare("UPDATE sms_campaigns SET status='completed' WHERE id=?").run(campaign.id);
  assert.equal((await campaigns.POST(f.request({action:'retryEmpty',id:campaign.id}))).status,409,'a campaign with any queued recipient cannot be replayed');
 }finally{f.sql.close();}
});

test('empty audiences pause instead of falsely completing; zero-send legacy campaigns can be explicitly retried',async()=>{
 const f=await fixture();try{
  f.env.SMS_LIVE_SEND_ENABLED='true';
  const api=load('app/api/admin/sms/campaigns/route.ts',f.imports);
  const group=await(await api.POST(f.request({action:'group',name:'empty'}))).json();
  const campaign=await(await api.POST(f.request({action:'create',groupId:group.id,name:'empty campaign',body:'mock',maxRecipients:10}))).json();
  await api.POST(f.request({action:'approve',id:campaign.id}));
  f.sql.exec('UPDATE sms_gateways SET enabled=1,inbound_enabled=1;UPDATE sms_gateway_agents SET enabled=1,last_inbox_at=CURRENT_TIMESTAMP');
  const {reconcileSms}=load('lib/server/sms/reconcile.ts',{'./domain':f.domain,'./acquisition':f.imports['@/lib/server/sms/acquisition']});await reconcileSms(f.db,{liveSendingEnabled:true});
  assert.equal(f.sql.prepare('SELECT status FROM sms_campaigns WHERE id=?').get(campaign.id).status,'paused');assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);
  f.sql.prepare("UPDATE sms_campaigns SET status='completed' WHERE id=?").run(campaign.id);
  assert.equal((await api.POST(f.request({action:'retryEmpty',id:campaign.id}))).status,200);assert.equal(f.sql.prepare('SELECT status FROM sms_campaigns WHERE id=?').get(campaign.id).status,'approved');
  assert.equal((await api.POST(f.request({action:'retryEmpty',id:campaign.id}))).status,409);
 }finally{f.sql.close();}
});

test('retired initial-consent action cannot clear opt-outs; dedicated opt-out cancels queued promotions',async()=>{const f=await fixture();try{
 f.env.SMS_LIVE_SEND_ENABLED='true';const route=load('app/api/admin/sms/route.ts',f.imports);
 const person=await(await route.POST(f.request({action:'contact',phone:'09123456789',name:'test'}))).json();
 const queue={action:'queue',contactId:person.id,body:'mock only',category:'promotional',expiresAt:new Date(Date.now()+3600000).toISOString(),idempotencyKey:'optout-case'};
 assert.equal((await route.POST(f.request(queue))).status,200);
 assert.equal((await route.POST(f.request({action:'optOut',contactId:person.id}))).status,200);
 assert.equal(f.sql.prepare('SELECT status FROM sms_messages').get().status,'cancelled');
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_consents').get().n,0);
 assert.equal((await route.POST(f.request({action:'consent',status:'granted',contactId:person.id,method:'form',textVersion:'v1',evidenceRef:'proof'}))).status,400);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_opt_outs').get().n,1);
 assert.equal((await route.POST(f.request({...queue,idempotencyKey:'blocked-again'}))).status,403);
}finally{f.sql.close();}});
