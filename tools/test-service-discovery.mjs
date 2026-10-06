import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,require){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,console});return exports;}
const catalog=load('lib/service-catalog.ts');
test('Every service has a unique destination and canonical lookup',()=>{const urls=catalog.serviceCatalog.map(catalog.servicePath);assert.equal(new Set(urls).size,new Set(catalog.serviceCatalog.map(item=>item.name)).size);for(const item of catalog.serviceCatalog)assert.equal(catalog.findService(item.category,catalog.serviceSlug(item.name))?.name,item.name);for(const item of catalog.serviceCatalog) assert.equal(catalog.findService(item.category,encodeURIComponent(catalog.serviceSlug(item.name)))?.name,item.name);assert.equal(catalog.findService('curtain','%'),undefined);assert.equal(catalog.findService('curtain','unknown'),undefined);});
test('Service sitemap requires exact selection and published complete unpaused booths',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec(`CREATE TABLE businesses(id INTEGER,slug TEXT,name TEXT,description TEXT,city TEXT,status TEXT);CREATE TABLE categories(id INTEGER,slug TEXT);CREATE TABLE services(id INTEGER,name TEXT);CREATE TABLE business_categories(business_id INTEGER,category_id INTEGER);CREATE TABLE business_services(business_id INTEGER,service_id INTEGER);CREATE TABLE business_service_areas(business_id INTEGER);CREATE TABLE business_visibility_controls(business_id INTEGER PRIMARY KEY,owner_paused INTEGER,updated_at TEXT);INSERT INTO categories VALUES(1,'curtain');INSERT INTO services VALUES(1,'میل‌پرده'),(2,'گیره پرده');`);
 const db={prepare(query){let args=[];return{bind(...x){args=x;return this},async all(){return{results:sql.prepare(query).all(...args)}},async run(){return sql.prepare(query).run(...args)}}}};
 const m=load('lib/server/service-sitemap.ts',name=>name==='cloudflare:workers'?{env:{DB:db}}:catalog);
 function add(id,status='published',service=1){sql.prepare('INSERT INTO businesses VALUES(?,?,?,?,?,?)').run(id,'offline-'+id,'Offline fixture','A sufficiently complete offline fixture','Test city',status);sql.prepare('INSERT INTO business_categories VALUES(?,1)').run(id);sql.prepare('INSERT INTO business_services VALUES(?,?)').run(id,service);sql.prepare('INSERT INTO business_service_areas VALUES(?)').run(id);}
 add(1);add(2);add(3,'pending');add(4,'published',2);assert.equal((await m.listServiceSitemapEntries()).length,0);
 sql.exec("UPDATE businesses SET status='published' WHERE id=3");let entries=await m.listServiceSitemapEntries();assert.equal(entries.length,1);assert.ok(entries[0].url.endsWith(encodeURIComponent('میل-پرده')));
 sql.exec('INSERT INTO business_visibility_controls VALUES(3,1,NULL)');assert.equal((await m.listServiceSitemapEntries()).length,0);
 sql.exec('DELETE FROM business_visibility_controls; DELETE FROM business_service_areas WHERE business_id=3');assert.equal((await m.listServiceSitemapEntries()).length,0);sql.close();
});
test('Public listing uses an exact selected service rather than profile text matching',()=>{const src=fs.readFileSync('lib/server/public-businesses.ts','utf8');assert.ok(src.includes('ss.name = ?'));assert.ok(src.includes('binds.push(options.serviceName)'));});
