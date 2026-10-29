import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('Service cards create the visibility table when needed and preserve publication rules', async () => {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`CREATE TABLE reviews(business_id INTEGER,rating INTEGER,status TEXT);
    CREATE TABLE businesses(id INTEGER,slug TEXT,name TEXT,description TEXT,city TEXT,area TEXT,status TEXT);
    CREATE TABLE business_service_areas(business_id INTEGER);
    CREATE TABLE business_categories(business_id INTEGER);
    CREATE TABLE services(id INTEGER,name TEXT);
    CREATE TABLE business_services(business_id INTEGER,service_id INTEGER);
    INSERT INTO services VALUES(1,'پرده مینیمال'),(2,'پرده زبرا');`);
  for (let id = 1; id <= 7; id++) {
    sql.prepare('INSERT INTO businesses VALUES(?,?,?,?,?,?,?)').run(id,id===7?'alayy-dkvr-krj':'shop-'+id,'نام غرفه','توضیح کامل و واقعی برای یک کسب و کار آزمایشی','تهران','مرکز',id===3?'draft':'published');
    sql.prepare('INSERT INTO business_services VALUES(?,?)').run(id,id===2?2:1);
    sql.prepare('INSERT INTO business_categories VALUES(?)').run(id);
    if (id !== 5) sql.prepare('INSERT INTO business_service_areas VALUES(?)').run(id);
  }
  sql.exec("CREATE TABLE business_visibility_controls(business_id INTEGER,owner_paused INTEGER); INSERT INTO business_visibility_controls VALUES(4,1); DROP TABLE business_visibility_controls; UPDATE businesses SET description='' WHERE id=6");
  let queries = 0;
  const db = { prepare(query) { queries++; let args = []; return {
    bind(...values) { args = values; return this; },
    async all() { return { results: sql.prepare(query).all(...args) }; },
    async run() { sql.prepare(query).run(...args); return {}; },
  }; }};
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/server/service-business-summaries.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:()=>({env:{DB:db}})});
  const rows = await exports.listServiceBusinessSummaries('پرده مینیمال');
  assert.deepEqual(rows.map(x=>x.id),[4,1]);
  assert.equal(queries,2);
  assert.equal((await exports.listServiceBusinessSummaries('نام ناشناخته')).length,0);
  assert.equal(queries,3);
  sql.close();
});
