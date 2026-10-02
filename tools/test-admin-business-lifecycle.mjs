import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function fixture({admin=true,failCleanup=false}={}) {
  const sql=new DatabaseSync(':memory:');
  sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE businesses(id INTEGER PRIMARY KEY,name TEXT,slug TEXT,status TEXT,updated_at TEXT); INSERT INTO businesses VALUES(1,'Shop','shop','published',NULL),(2,'Draft','draft','draft',NULL); CREATE TABLE invoices(id INTEGER PRIMARY KEY,business_id INTEGER); CREATE TABLE business_media(id INTEGER PRIMARY KEY,business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,provider TEXT,provider_file_id TEXT,storage_key TEXT); INSERT INTO business_media VALUES(1,1,'imagekit','image-1',NULL),(2,1,'r2',NULL,'businesses/1/photo.webp');");
  const db={prepare(query){return {values:[],bind(...values){this.values=values;return this;},async first(){return sql.prepare(query).get(...this.values)||null;},async all(){return {results:sql.prepare(query).all(...this.values)};},async run(){return {meta:{changes:sql.prepare(query).run(...this.values).changes}};}};},async batch(statements){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}};
  const deleted=[];
  const imports={'cloudflare:workers':{env:{DB:db}},'@/lib/server/admin-session':{isAdminRequest:async()=>admin},'@/lib/server/business-media':{ensureBusinessMediaSchema:async()=>{}},'@/lib/server/business-media-storage':{deleteStoredBusinessImage:async(...args)=>{if(failCleanup)throw Error('Storage unavailable');deleted.push(args);}}};
  const exports={};
  vm.runInNewContext(ts.transpileModule(readFileSync('app/api/admin/businesses/[id]/lifecycle/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{assert.ok(name in imports,name);return imports[name];},Response,Request,Number,String});
  const call=(action,id=1,confirmationName='Shop')=>exports.POST(new Request('https://khonenama.ir/api/admin/businesses/'+id+'/lifecycle',{method:'POST',body:JSON.stringify({action,confirmationName})}),{params:Promise.resolve({id:String(id)})});
  return {sql,deleted,call};
}

test('Lifecycle requires administrator authentication',async()=>{const {call,sql}=fixture({admin:false});assert.equal((await call('remove')).status,401);assert.equal(sql.prepare('SELECT status FROM businesses WHERE id=1').get().status,'published');});
test('Removal hides public business, is repeatable and restoration preserves draft status',async()=>{const {call,sql}=fixture();await call('remove');await call('remove');assert.equal(sql.prepare("SELECT COUNT(*) n FROM businesses WHERE status='published'").get().n,0);assert.equal(sql.prepare('SELECT COUNT(*) n FROM business_admin_actions').get().n,1);await call('restore');assert.equal(sql.prepare('SELECT status FROM businesses WHERE id=1').get().status,'published');await call('remove',2);await call('restore',2);assert.equal(sql.prepare('SELECT status FROM businesses WHERE id=2').get().status,'draft');});
test('Permanent deletion requires prior removal and exact name on server',async()=>{const {call,sql,deleted}=fixture();assert.equal((await call('purge')).status,409);await call('remove');assert.equal((await call('purge',1,'Wrong')).status,400);assert.equal(sql.prepare('SELECT COUNT(*) n FROM businesses WHERE id=1').get().n,1);assert.equal(deleted.length,0);});
test('Financial records prevent permanent deletion and storage cleanup',async()=>{const {call,sql,deleted}=fixture();await call('remove');sql.exec('INSERT INTO invoices VALUES(1,1)');assert.equal((await call('purge')).status,409);assert.equal(deleted.length,0);assert.equal(sql.prepare('SELECT status FROM businesses WHERE id=1').get().status,'suspended');});
test('Storage failure retains suspended business for retry',async()=>{const {call,sql}=fixture({failCleanup:true});await call('remove');assert.equal((await call('purge')).status,502);assert.equal(sql.prepare('SELECT status FROM businesses WHERE id=1').get().status,'suspended');assert.equal(sql.prepare('SELECT COUNT(*) n FROM business_media').get().n,2);});
test('Permanent deletion cleans both storage providers, cascades media and retains audit',async()=>{const {call,sql,deleted}=fixture();await call('remove');const response=await call('purge');assert.equal(response.status,200);assert.equal((await response.json()).deleted,true);assert.deepEqual(deleted,[['imagekit','image-1'],['r2','businesses/1/photo.webp']]);assert.equal(sql.prepare('SELECT COUNT(*) n FROM business_media').get().n,0);assert.equal(sql.prepare('SELECT COUNT(*) n FROM businesses WHERE id=1').get().n,0);assert.equal(sql.prepare("SELECT COUNT(*) n FROM business_admin_actions WHERE action='purge'").get().n,1);});
