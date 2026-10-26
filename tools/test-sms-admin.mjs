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
  vm.runInNewContext(code,{exports,require:name=>{assert.ok(name in imports,name);return imports[name];},crypto:webcrypto,TextEncoder,Uint8Array,Date,URL,Request,Response,Headers,btoa,console});
  return exports;
}
async function fixture(){
  const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('db/migrations/0012_sms_center.sql','utf8'));
  const db={prepare(query){return{values:[],bind(...values){this.values=values;return this;},async first(){return sql.prepare(query).get(...this.values)||null;},async all(){return{results:sql.prepare(query).all(...this.values)};},async run(){return{meta:{changes:sql.prepare(query).run(...this.values).changes}};}};}};
  const env={DB:db,ADMIN_ACCESS_KEY:'test-site-key-only',SMS_BRIDGE_TOKEN:'test-bridge-key-only'};
  const admin=load('lib/server/admin-session.ts',{'cloudflare:workers':{env}});
  const auth=load('lib/server/sms/admin-auth.ts',{'cloudflare:workers':{env},'@/lib/server/admin-session':admin});
  const domain=load('lib/server/sms/domain.ts'),config=load('lib/server/sms/config.ts');
  const imports={'cloudflare:workers':{env},'@/lib/server/admin-session':admin,'@/lib/server/sms/admin-auth':auth,'@/lib/server/sms/domain':domain,'@/lib/server/sms/config':config};
  const cookie=(await admin.createAdminCookie()).split(';')[0];
  const request=(body,cookies=cookie)=>new Request('https://sms.khonenama.ir/api/admin/sms',{method:'POST',headers:{cookie:cookies,origin:'https://sms.khonenama.ir','content-type':'application/json'},body:JSON.stringify(body)});
  const get=(path,cookies=cookie)=>new Request('https://sms.khonenama.ir'+path,{headers:{cookie:cookies}});
  return{sql,db,env,admin,auth,domain,config,imports,cookie,request,get};
}

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
    const denied=await route.POST(f.request({...input,category:'promotional',idempotencyKey:'promotional-live'}));assert.equal(denied.status,403);
    delete f.env.SMS_LIVE_SEND_ENABLED;
    const promotional=await(await route.POST(f.request({...input,category:'promotional',idempotencyKey:'promotional-draft'}))).json();assert.equal(promotional.status,'draft');
    const data=await(await route.GET(f.get('/api/admin/sms'))).json();
    assert.equal(data.messages.length,2);assert.ok(data.messages.every(message=>!message.phone_e164.includes('9123456789')));
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
    const bridge=load('lib/server/sms/bridge.ts',{'cloudflare:workers':{env:f.env},'./domain':f.domain,'./config':f.config,'./queue':{CLAIM_SQL:'FORBIDDEN_DISPATCH_SQL'}});
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
    const {reconcileSms}=load('lib/server/sms/reconcile.ts',{'./domain':f.domain});
    await reconcileSms(f.db,{liveSendingEnabled:false});
    assert.equal(f.sql.prepare('SELECT status FROM sms_campaigns').get().status,'approved');
    assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM sms_messages').get().n,0);
  }finally{f.sql.close();}
});
