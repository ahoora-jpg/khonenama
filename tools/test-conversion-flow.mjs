import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,imports={}) {const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.ok(n in imports,n);return imports[n]},Response,Request,URL,console,Date,Set});return exports;}
function fixture(status='draft') {
 const sql=new DatabaseSync(':memory:');
 sql.exec("CREATE TABLE businesses(id INTEGER PRIMARY KEY,name TEXT,description TEXT,city TEXT,status TEXT,updated_at TEXT);CREATE TABLE business_members(business_id INTEGER,user_id TEXT,status TEXT,role TEXT);CREATE TABLE business_services(business_id INTEGER);CREATE TABLE business_categories(business_id INTEGER);CREATE TABLE business_service_areas(business_id INTEGER);INSERT INTO business_members VALUES(1,'owner','active','owner');INSERT INTO business_services VALUES(1);INSERT INTO business_categories VALUES(1);INSERT INTO business_service_areas VALUES(1)");
 sql.prepare('INSERT INTO businesses VALUES(1,?,?,?,?,NULL)').run('Test shop','Complete business description','Test city',status);
 const db={prepare(query){return{values:[],bind(...values){this.values=values;return this},async first(){return sql.prepare(query).get(...this.values)||null},async all(){return{results:sql.prepare(query).all(...this.values)}},async run(){return{meta:{changes:sql.prepare(query).run(...this.values).changes}}}}}};
 const metrics=load('lib/server/conversion-metrics.ts');
 const route=load('app/api/me/business/route.ts',{'cloudflare:workers':{env:{DB:db}},'@/lib/server/business-session':{getBusinessSession:async()=>({user_id:'owner'})},'@/lib/business-slug':{},'@/lib/server/conversion-metrics':metrics});
 return{sql,db,route,metrics};
}
const publish=()=>new Request('https://khonenama.ir/api/me/business',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'publish'})});
test('Complete draft publishes explicitly and repeat calls count publication once',async()=>{const{sql,route}=fixture();assert.equal((await route.PATCH(publish())).status,200);assert.equal(sql.prepare('SELECT status FROM businesses').get().status,'published');assert.equal((await route.PATCH(publish())).status,200);assert.equal(sql.prepare("SELECT count FROM marketplace_conversion_daily WHERE event='booth_published'").get().count,1)});
test('Missing services prevent publication and return the next required action',async()=>{const{sql,route}=fixture();sql.exec('DELETE FROM business_services');const response=await route.PATCH(publish());assert.equal(response.status,409);assert.ok((await response.json()).missing.includes('خدمات اصلی'));assert.equal(sql.prepare('SELECT status FROM businesses').get().status,'draft')});
for(const status of ['suspended','pending']) test(`Owner cannot bypass ${status} moderation`,async()=>{const{sql,route}=fixture(status);assert.equal((await route.PATCH(publish())).status,409);assert.equal(sql.prepare('SELECT status FROM businesses').get().status,status)});
test('Conversion storage contains aggregate counts and no customer fields',async()=>{const{sql,db,metrics}=fixture();await metrics.recordConversion(db,'registration_start');await metrics.recordConversion(db,'business_registered');assert.deepEqual(sql.prepare('PRAGMA table_info(marketplace_conversion_daily)').all().map(r=>r.name),['event_date','event','count'])});
