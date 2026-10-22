import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
function load(file,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.ok(n in imports,n);return imports[n]},Response,Request,URL,crypto:webcrypto});return exports;}
function fixture(){const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('db/schema.sql','utf8'));sql.exec("INSERT INTO businesses(id,slug,name,city,status) VALUES(1,'one','One','Tehran','published'); INSERT INTO subscriptions(id,business_id,plan_id,status,starts_at,ends_at) SELECT 1,1,id,'active','2026-01-01','2099-01-01' FROM plans WHERE code='premium';");const db={async batch(statements){return Promise.all(statements.map(s=>s.run()))},prepare(q){return{v:[],bind(...v){this.v=v;return this},async first(){return sql.prepare(q).get(...this.v)||null},async all(){return {results:sql.prepare(q).all(...this.v)}},async run(){return{meta:{changes:sql.prepare(q).run(...this.v).changes}}}}}};const entitlement=load('lib/business-entitlements.ts');const promotion=load('lib/server/business-promotion.ts',{'@/lib/business-entitlements':entitlement,'@/lib/story-templates':load('lib/story-templates.ts')});const resolver=load('app/p/[token]/route.ts',{'cloudflare:workers':{env:{DB:db}}});return{sql,db,promotion,resolver};}
test('Free has no legacy templates, professional has two, premium four',()=>{const f=fixture();assert.equal(f.promotion.storyTemplateCount('free'),0);assert.equal(f.promotion.storyTemplateCount('pro'),2);assert.equal(f.promotion.storyTemplateCount('premium'),4);assert.equal(f.promotion.storyTemplateCount('invented'),0);});
test('Promotion links are stable during a subscription and stop resolving after expiry',async()=>{const f=fixture();const sub=await f.promotion.promotionSubscription(f.db,1);const url=await f.promotion.promotionLink(f.db,1,sub);assert.equal(await f.promotion.promotionLink(f.db,1,sub),url);const token=url.split('/').at(-1);const get=()=>f.resolver.GET(new Request(url),{params:Promise.resolve({token})});assert.equal((await get()).status,302);f.sql.exec("UPDATE subscriptions SET ends_at='2000-01-01' WHERE id=1");assert.equal((await get()).status,410);});
test('New subscription issues a different link; blocked booths cannot resolve',async()=>{const f=fixture();const old=await f.promotion.promotionLink(f.db,1,await f.promotion.promotionSubscription(f.db,1));f.sql.exec("UPDATE subscriptions SET status='expired' WHERE id=1; INSERT INTO subscriptions(id,business_id,plan_id,status,starts_at,ends_at) SELECT 2,1,id,'active','2026-01-01','2099-01-01' FROM plans WHERE code='pro';");const next=await f.promotion.promotionLink(f.db,1,await f.promotion.promotionSubscription(f.db,1));assert.notEqual(old,next);assert.equal((await f.resolver.GET(new Request(old),{params:Promise.resolve({token:old.split('/').at(-1)})})).status,410);f.sql.exec("UPDATE businesses SET status='draft' WHERE id=1");assert.equal((await f.resolver.GET(new Request(next),{params:Promise.resolve({token:next.split('/').at(-1)})})).status,410);});
test('Anonymous and free callers cannot obtain promotion assets',async()=>{const f=fixture();let owner=null;const route=load('app/api/me/business/promotion/route.ts',{'@/lib/server/business-media':{getOwnedBusiness:async()=>owner},'@/lib/server/business-promotion':f.promotion,'@/lib/story-templates':load('lib/story-templates.ts'),'@/lib/server/story-settings':load('lib/server/story-settings.ts',{'@/lib/story-templates':load('lib/story-templates.ts')})});const req=new Request('https://khonenama.ir/api/me/business/promotion');assert.equal((await route.GET(req)).status,401);f.sql.exec("UPDATE subscriptions SET status='expired'");owner={db:f.db,business:{id:1,name:'One'}};assert.equal((await route.GET(req)).status,403);});
test('Analytics source classification rejects lookalike search/social hosts',()=>{const sources=load('lib/server/analytics-sources.ts');assert.equal(sources.analyticsSource('https://www.google.com/search?q=x',''),'search');assert.equal(sources.analyticsSource('https://google.com.evil.test',''),'referral');assert.equal(sources.analyticsSource('javascript:alert(1)',''),'unknown');assert.equal(sources.analyticsSource('','khonenama-promotion'),'promotion');});
test('Server checks template tier and gallery ownership; administrator disable takes immediate effect',async()=>{
  const f=fixture();const templates=load('lib/story-templates.ts');const settings=load('lib/server/story-settings.ts',{'@/lib/story-templates':templates});
  const route=load('app/api/me/business/promotion/route.ts',{'@/lib/server/business-media':{getOwnedBusiness:async()=>({db:f.db,business:{id:1,name:'One'}})},'@/lib/server/business-promotion':f.promotion,'@/lib/story-templates':templates,'@/lib/server/story-settings':settings});
  f.sql.exec("UPDATE subscriptions SET plan_id=(SELECT id FROM plans WHERE code='pro')");
  assert.equal((await route.GET(new Request('https://khonenama.ir/api/me/business/promotion?template=3'))).status,403);
  assert.equal((await route.GET(new Request('https://khonenama.ir/api/me/business/promotion?template=1&image=99'))).status,403);
  await settings.ensureStorySettings(f.db);await f.db.prepare('INSERT INTO story_template_settings(id,settings_json) VALUES(1,?)').bind(JSON.stringify({enabled:false})).run();
  assert.equal((await route.GET(new Request('https://khonenama.ir/api/me/business/promotion?template=1'))).status,403);
  const result=await (await route.GET(new Request('https://khonenama.ir/api/me/business/promotion'))).json();assert.equal(result.availableTemplates.length,1);assert.equal(result.availableTemplates[0].id,2);
});
test('Template settings reject arbitrary fetch URLs and HTML color injection',()=>{
  const settings=load('lib/server/story-settings.ts',{'@/lib/story-templates':load('lib/story-templates.ts')});
  const valid={id:1,enabled:true,minimumPlan:'pro',background:'#ffffff',ink:'#123456',accent:'#abcdef',showPhone:true,showCity:true,showCategory:true,backgroundAsset:''};
  assert.ok(settings.validateStorySetting(valid));assert.equal(settings.validateStorySetting({...valid,backgroundAsset:'https://evil.test/image.jpg'}),null);assert.equal(settings.validateStorySetting({...valid,ink:'<script>'}),null);
});
test('Prepared story choices are limited per subscription and can be reused',async()=>{
  const f=fixture();let owner={db:f.db,business:{id:1,name:'One'}};
  const route=load('app/api/me/business/story-selection/route.ts',{'@/lib/server/business-media':{getOwnedBusiness:async()=>owner},'@/lib/server/business-promotion':f.promotion});
  const post=id=>route.POST(new Request('https://khonenama.ir/api/me/business/story-selection',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({templateId:id})}));
  f.sql.exec("UPDATE subscriptions SET plan_id=(SELECT id FROM plans WHERE code='pro')");
  assert.equal((await post(24)).status,200);assert.equal((await post(24)).status,200);assert.equal((await post(1)).status,409);assert.equal((await post(25)).status,400);
  f.sql.exec("UPDATE subscriptions SET status='expired'; INSERT INTO subscriptions(id,business_id,plan_id,status,starts_at,ends_at) SELECT 2,1,id,'active','2026-01-01','2099-01-01' FROM plans WHERE code='premium'");
  for(const id of [1,4,16,24])assert.equal((await post(id)).status,200);
  assert.equal((await post(5)).status,409);
  owner=null;assert.equal((await post(1)).status,403);
});
test('Supporting photos remain ownership-bound and are limited to three real images',async()=>{
  const f=fixture();const templates=load('lib/story-templates.ts');const settings=load('lib/server/story-settings.ts',{'@/lib/story-templates':templates});
  const route=load('app/api/me/business/promotion/route.ts',{'@/lib/server/business-media':{getOwnedBusiness:async()=>({db:f.db,business:{id:1,name:'One'}})},'@/lib/server/business-promotion':f.promotion,'@/lib/story-templates':templates,'@/lib/server/story-settings':settings});
  f.sql.exec("INSERT INTO businesses(id,slug,name,city) VALUES(2,'other','Other','Tehran');INSERT INTO business_media(id,business_id,storage_key,file_url) VALUES(10,1,'one','/one.webp'),(11,2,'two','/two.webp');");
  const get=query=>route.GET(new Request('https://khonenama.ir/api/me/business/promotion?template=1&'+query));
  const own=await(await get('supporting=10')).json();assert.equal(own.supportingImages.length,1);assert.equal(own.supportingImages[0].id,10);
  assert.equal((await get('supporting=11')).status,403);
  assert.equal((await get('supporting=10,11,12,13')).status,400);
  assert.equal((await get('supporting=https://evil.test')).status,400);
});
test('Repeated analytics events count once, bots do not count, free reports expose only permitted totals',async()=>{
  const f=fixture();const sources=load('lib/server/analytics-sources.ts');
  const route=load('app/api/business/[slug]/analytics/route.ts',{'cloudflare:workers':{env:{DB:f.db}},'@/lib/server/analytics-sources':sources});
  const req=(agent='Browser')=>new Request('https://khonenama.ir/api/business/one/analytics',{method:'POST',headers:{'content-type':'application/json','user-agent':agent,cookie:'kn_analytics=0123456789abcdef0123456789abcdef'},body:JSON.stringify({event:'view',source:'google'})});
  for(let i=0;i<3;i++)assert.equal((await route.POST(req(),{params:Promise.resolve({slug:'one'})})).status,200);
  await route.POST(req('Googlebot'),{params:Promise.resolve({slug:'one'})});
  assert.equal(f.sql.prepare('SELECT profile_views FROM business_analytics_daily').get().profile_views,1);
  const report=load('app/api/me/business/analytics/route.ts',{'@/lib/server/business-media':{getOwnedBusiness:async()=>({db:f.db,business:{id:1}})},'@/lib/server/business-promotion':f.promotion,'@/lib/server/analytics-sources':sources});
  const premium=await (await report.GET(new Request('https://khonenama.ir/api/me/business/analytics'))).json();assert.equal(premium.daily.length,30);assert.equal(premium.sources[0].source,'search');
  f.sql.exec("UPDATE subscriptions SET status='expired'");const free=await (await report.GET(new Request('https://khonenama.ir/api/me/business/analytics'))).json();assert.equal(free.daily.length,0);assert.deepEqual(Object.keys(free.totals).sort(),['profileViews','quoteSubmits']);assert.equal(free.sources,undefined);
});
test('Premium report applies the selected period to sent proposals and saved requests',async()=>{
  const f=fixture();const sources=load('lib/server/analytics-sources.ts');
  f.sql.exec("INSERT INTO leads(id,city,request_text,created_at) VALUES(1,'Tehran','one',datetime('now','-2 days')),(2,'Tehran','two',datetime('now','-20 days')); INSERT INTO lead_recipients(lead_id,business_id) VALUES(1,1),(2,1); INSERT INTO lead_quotes(lead_id,business_id,status,created_at) VALUES(1,1,'sent',datetime('now','-1 day')),(2,1,'accepted',datetime('now','-19 days'));");
  const report=load('app/api/me/business/analytics/route.ts',{'@/lib/server/business-media':{getOwnedBusiness:async()=>({db:f.db,business:{id:1}})},'@/lib/server/business-promotion':f.promotion,'@/lib/server/analytics-sources':sources});
  const week=await(await report.GET(new Request('https://khonenama.ir/api/me/business/analytics?days=7'))).json();
  const month=await(await report.GET(new Request('https://khonenama.ir/api/me/business/analytics?days=30'))).json();
  assert.equal(week.totals.proposalsSent,1);assert.equal(week.totals.proposalsAccepted,0);assert.equal(week.totals.quoteSubmits,1);
  assert.equal(month.totals.proposalsSent,2);assert.equal(month.totals.proposalsAccepted,1);assert.equal(month.totals.quoteSubmits,2);
});
