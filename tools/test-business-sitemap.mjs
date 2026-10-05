import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Offline fixtures only. These tests never register or publish live businesses.
function fixture() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(`
    CREATE TABLE businesses(id INTEGER PRIMARY KEY, slug TEXT, name TEXT, description TEXT, city TEXT, status TEXT, updated_at TEXT);
    CREATE TABLE business_categories(business_id INTEGER);
    CREATE TABLE business_services(business_id INTEGER);
    CREATE TABLE business_service_areas(business_id INTEGER);
    CREATE TABLE plans(id INTEGER PRIMARY KEY, code TEXT);
    CREATE TABLE subscriptions(id INTEGER PRIMARY KEY, business_id INTEGER, plan_id INTEGER, status TEXT, ends_at TEXT);
    CREATE TABLE business_visibility_controls(business_id INTEGER PRIMARY KEY, owner_paused INTEGER, updated_at TEXT);
  `);
  const db = {prepare(query) {
    let values = [];
    return {
      bind(...args) { values = args; return this; },
      async all() { return {results:sql.prepare(query).all(...values)}; },
      async run() { return sql.prepare(query).run(...values); }
    };
  }};
  const exports = {};
  const source = ts.transpileModule(readFileSync('lib/server/business-sitemap.ts','utf8'), {
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  vm.runInNewContext(source, {
    exports, require(name) { assert.equal(name,'cloudflare:workers'); return {env:{DB:db}}; }, console
  });
  const add = (id, status='published', slug='fixture-'+id) => {
    sql.prepare('INSERT INTO businesses VALUES(?,?,?,?,?,?,?)').run(id,slug,'Offline fixture '+id,'A complete offline fixture description','Test city',status,'2026-10-05 00:00:00');
    for (const table of ['business_categories','business_services','business_service_areas'])
      sql.prepare('INSERT INTO '+table+' VALUES(?)').run(id);
  };
  return {sql,add,list:exports.listPublishedBusinessSitemapEntries};
}

test('A complete free booth becomes discoverable only after publication; pause and suspension remove it',async()=>{
  const {sql,add,list}=fixture();
  add(1,'pending'); add(2,'draft'); add(3,'suspended');
  assert.equal((await list()).length,0);
  sql.exec("UPDATE businesses SET status='published' WHERE id=1");
  const entries=await list();
  assert.equal(entries.length,1);
  assert.equal(entries[0].slug,'fixture-1');
  assert.equal(entries[0].planCode,'free');
  assert.equal(entries[0].updatedAt,'2026-10-05 00:00:00');
  assert.deepEqual(Object.keys(entries[0]).sort(),['planCode','slug','updatedAt']);
  sql.exec('INSERT INTO business_visibility_controls VALUES(1,1,NULL)');
  assert.equal((await list()).length,0);
  sql.exec('UPDATE business_visibility_controls SET owner_paused=0');
  assert.equal((await list()).length,1);
  sql.exec("UPDATE businesses SET status='suspended' WHERE id=1");
  assert.equal((await list()).length,0);
  sql.close();
});

test('Incomplete and internal test booths stay out of the sitemap',async()=>{
  const {sql,add,list}=fixture();
  for(let id=1;id<=9;id++) add(id);
  sql.exec(`
    UPDATE businesses SET name='' WHERE id=1;
    UPDATE businesses SET description='short' WHERE id=2;
    UPDATE businesses SET city='' WHERE id=3;
    UPDATE businesses SET slug='x' WHERE id=4;
    DELETE FROM business_categories WHERE business_id=5;
    DELETE FROM business_services WHERE business_id=6;
    DELETE FROM business_service_areas WHERE business_id=7;
    UPDATE businesses SET slug='alayy-dkvr-krj' WHERE id=8;
  `);
  assert.deepEqual(Array.from(await list(),entry=>entry.slug),['fixture-9']);
  sql.close();
});

test('Sitemap discovery crosses the 500-row batch boundary without dropping or duplicating booths',async()=>{
  const {sql,add,list}=fixture();
  sql.exec('BEGIN');
  for(let id=1;id<=1001;id++) add(id);
  sql.exec('COMMIT');
  const entries=await list();
  assert.equal(entries.length,1001);
  assert.equal(new Set(entries.map(entry=>entry.slug)).size,1001);
  assert.equal(entries[0].slug,'fixture-1001');
  assert.equal(entries.at(-1).slug,'fixture-1');
  sql.close();
});
