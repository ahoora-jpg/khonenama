import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { DatabaseSync } from 'node:sqlite';

function moduleFrom(path, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL('../'+path,import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const module = {exports:{}};
  new Function('exports','module','require',code)(module.exports,module,name=>{if(!(name in dependencies))throw Error(name);return dependencies[name];});
  return module.exports;
}
const pure=moduleFrom('lib/taxonomy-suggestions.ts');
const server=moduleFrom('lib/server/taxonomy-suggestions.ts',{'@/lib/taxonomy-suggestions':pure});

test('names normalize Arabic letters and whitespace without inventing semantic spelling corrections',()=>{
  assert.equal(pure.normalizeTaxonomySuggestion('  ديوارپوش\n چسبي '),'دیوارپوش چسبی');
  assert.deepEqual(pure.taxonomySuggestions({categorySuggestion:' ',serviceSuggestion:42}),[]);
  assert.equal(pure.normalizeTaxonomySuggestion('الف'.repeat(100)).length,120);
  assert.equal(pure.normalizeTaxonomySuggestion('<script>'),'\u003cscript>');
});

test('suggestions remain a private review queue, deduplicate and disappear with the owning business',async()=>{
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON; CREATE TABLE businesses(id INTEGER PRIMARY KEY); INSERT INTO businesses VALUES(1);');
  const db={prepare(sql){let values=[];const statement=sqlite.prepare(sql);return {bind(...args){values=args;return this;},async run(){return statement.run(...values);}};},async batch(statements){for(const statement of statements)await statement.run();}};
  const body={categorySuggestion:'دسته جدید',serviceSuggestion:'خدمت جدید'};
  await server.saveTaxonomySuggestions(db,1,body,['wallpaper']);
  await server.saveTaxonomySuggestions(db,1,body,['wallpaper']);
  const rows=sqlite.prepare('SELECT * FROM taxonomy_suggestions').all();
  assert.equal(rows.length,2);
  assert.ok(rows.every(x=>x.status==='pending'&&x.normalized_name===null&&x.selected_categories==='["wallpaper"]'));
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name IN ('categories','services')").get().n,0);
  sqlite.exec('DELETE FROM businesses WHERE id=1');
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM taxonomy_suggestions').get().n,0);
  sqlite.close();
});

test('new services append without changing existing index-based service identifiers',()=>{
  const {BUSINESS_CATEGORY_BY_SLUG:categories}=moduleFrom('lib/business-taxonomy.ts');
  assert.equal(categories.curtain.services[9],'نصب و تعمیر پرده');
  assert.equal(categories.curtain.services[10],'پارچه پرده');
  assert.equal(categories.wallpaper.services[9],'نصب کاغذ دیواری و دیوارپوش');
  assert.equal(categories['interior-design'].services[14],'اجرا و نظارت پروژه');
  for(const category of Object.values(categories))assert.equal(new Set(category.services).size,category.services.length);
});
