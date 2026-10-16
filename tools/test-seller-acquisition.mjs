import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, imports = {}) {
 const exports = {};
 vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
 { exports, require: name => {assert.ok(name in imports,name);return imports[name]},Request,Response,URL,console });
 return exports;
}
const events = load('lib/seller-acquisition-events.ts');
const security = load('lib/request-security.ts');
function fixture(db = {}) {
 const calls=[];
 const route = load('app/api/seller-acquisition/route.ts', {
  'cloudflare:workers':{env:{DB:db}}, '@/lib/request-security':security,
  '@/lib/seller-acquisition-events':events,
  '@/lib/server/conversion-metrics':{recordConversion:async(database,event)=>{calls.push({database,event});return true}}
 });
 return {route,calls};
}
const request = (body,origin='https://khonenama.ir') => new Request('https://khonenama.ir/api/seller-acquisition', {method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
test('Public metrics cannot forge registrations, publication or paid subscriptions',async()=>{
 const {route,calls}=fixture();
 for(const event of ['business_registered','booth_published','subscription_paid','phone_verified','',null]) assert.equal((await route.POST(request({event}))).status,400);
 assert.equal(calls.length,0);
});
test('Only event labels are accepted; identity and referrer payloads are rejected',async()=>{
 const {route,calls}=fixture();
 assert.equal((await route.POST(request({event:'seller_landing_view',phone:'private'}))).status,400);
 assert.equal((await route.POST(request({event:'seller_landing_view',referrer:'private'}))).status,400);
 for(const event of events.sellerAcquisitionEvents) assert.equal((await route.POST(request({event}))).status,204);
 assert.equal(calls.length,3);
 assert.deepEqual(Object.keys(calls[0]),['database','event']);
});
test('Cross-site events and missing storage fail closed; rate policy applies',async()=>{
 assert.equal((await fixture().route.POST(request({event:'seller_landing_view'},'https://evil.example'))).status,403);
 assert.equal((await fixture(null).route.POST(request({event:'seller_landing_view'}))).status,503);
 assert.equal(security.publicRequestLimit('/api/seller-acquisition'),30);
});
test('Conversion storage failure is observable rather than a successful tracking response',async()=>{
 const metrics=load('lib/server/conversion-metrics.ts');
 assert.equal(await metrics.recordConversion({prepare(){throw Error('offline')}},'seller_landing_view'),false);
});
