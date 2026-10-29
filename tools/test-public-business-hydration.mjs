import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';

function load(file, imports = {}, source = fs.readFileSync(file, 'utf8')) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  }}).outputText, {exports, require(name) {
    assert.ok(name in imports, name);
    return imports[name];
  }, console});
  return exports;
}
const plain = value => JSON.parse(JSON.stringify(value));

export function fixture(count = 3, source) {
  const sql = new DatabaseSync(':memory:');
  sql.exec(fs.readFileSync('db/schema.sql', 'utf8'));
  sql.exec(`CREATE TABLE business_visibility_controls(business_id INTEGER PRIMARY KEY, owner_paused INTEGER DEFAULT 0);
    CREATE TABLE review_replies(review_id INTEGER PRIMARY KEY, business_id INTEGER, body TEXT);
    CREATE TABLE business_coverage_notes(business_id INTEGER PRIMARY KEY, note TEXT);
    CREATE TABLE business_installment_options(business_id INTEGER PRIMARY KEY, show_installments INTEGER);
    CREATE TABLE subscription_custom_capacity(subscription_id INTEGER PRIMARY KEY, packs INTEGER);`);
  for (let id = 1; id <= count; id++) {
    sql.prepare("INSERT INTO businesses(id,slug,name,city,status) VALUES(?,?,?,'کرج','published')").run(id, `booth-${id}`, `Booth ${id}`);
  }
  const stats = {statements: 0, calls: 0, batches: 0, maxBinds: 0};
  const db = {
    prepare(query) {
      let values = [];
      return {
        bind(...args) {
          assert.ok(args.length <= 100, 'D1 bind limit');
          stats.maxBinds = Math.max(stats.maxBinds, args.length);
          values = args; return this;
        },
        execute(mode) {
          stats.statements++;
          const statement = sql.prepare(query);
          if (mode === 'first') return statement.get(...values) || null;
          if (mode === 'all') return {results: statement.all(...values)};
          return {meta: {changes: statement.run(...values).changes}};
        },
        async all() { stats.calls++; return this.execute('all'); },
        async first() { stats.calls++; return this.execute('first'); },
        async run() { stats.calls++; return this.execute('run'); },
      };
    },
    async batch(statements) {
      stats.calls++; stats.batches++;
      sql.exec('BEGIN');
      try {
        const result = statements.map(statement => statement.execute('all'));
        sql.exec('COMMIT'); return result;
      } catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  const entitlements = load('lib/business-entitlements.ts');
  const api = load('lib/server/public-businesses.ts', {
    'cloudflare:workers': {env: {DB: db}},
    '@/lib/server/business-installments': load('lib/server/business-installments.ts'),
    '@/lib/business-entitlements': entitlements,
    '@/lib/service-area': load('lib/service-area.ts'),
    '@/lib/service-search': load('lib/service-search.ts', {'./business-taxonomy': load('lib/business-taxonomy.ts')}),
    '@/lib/server/business-coverage': load('lib/server/business-coverage.ts'),
    '@/lib/karaj-areas': {KARAJ_AREAS: []},
    '@/lib/subscription-lifecycle': load('lib/subscription-lifecycle.ts', {'./business-entitlements': entitlements}),
    '@/lib/server/business-media': load('lib/server/business-media.ts', {
      'cloudflare:workers': {env: {DB: db}}, '@/lib/server/business-session': {},
    }),
    '@/lib/server/review-replies': load('lib/server/review-replies.ts'),
  }, source);
  return {sql, db, stats, api};
}

export function seedDetails(sql) {
  sql.exec(`INSERT INTO business_categories SELECT 1,id,1 FROM categories WHERE slug='curtain';
    INSERT INTO services(slug,name,category_id) SELECT 'test-curtain-service','Test curtain service',id FROM categories WHERE slug='curtain';
    INSERT INTO business_services SELECT 1,id FROM services WHERE slug='test-curtain-service';
    INSERT INTO subscriptions(id,business_id,plan_id,starts_at,ends_at,status) SELECT 1,1,id,'2020-01-01',NULL,'active' FROM plans WHERE code='pro';
    INSERT INTO subscriptions(id,business_id,plan_id,starts_at,ends_at,status) SELECT 2,1,id,'2020-01-01','2099-01-01','active' FROM plans WHERE code='premium';
    INSERT INTO subscriptions(id,business_id,plan_id,starts_at,ends_at,status) SELECT 3,1,id,'2020-01-01','2001-01-01','active' FROM plans WHERE code='pro';
    INSERT INTO subscription_custom_capacity VALUES(2,1);
    INSERT INTO business_installment_options VALUES(1,1);
    INSERT INTO business_coverage_notes VALUES(1,'Coverage');
    INSERT INTO business_service_areas(business_id,city,area) VALUES(1,'کرج','تمام کرج'),(1,'کرج','مرکز');
    INSERT INTO business_hours(business_id,weekday,opens_at,closes_at,is_closed) VALUES(1,2,'09:00','17:00',0),(1,1,NULL,NULL,1);
    INSERT INTO promotions(business_id,kind,starts_at,ends_at,status) VALUES(2,'boost','2000-01-01','2099-01-01','active'),(3,'boost','2000-01-01','2001-01-01','active');`);
  for (let id = 1; id <= 12; id++) {
    sql.prepare("INSERT INTO reviews(id,business_id,rating,body,status,created_at) VALUES(?,1,4,?,'published','2020-01-01')").run(id, `Review ${id}`);
  }
  sql.exec("INSERT INTO reviews(id,business_id,rating,body,status) VALUES(99,1,1,'Hidden','pending'),(100,2,5,'Other booth','published'); INSERT INTO review_replies VALUES(12,1,'Reply');");
  for (const businessId of [1, 2]) {
    for (let i = 1; i <= 95; i++) {
      sql.prepare("INSERT INTO business_media(business_id,storage_key,file_url,sort_order) VALUES(?,?,?,?)").run(businessId, `key-${i}`, `/photo-${businessId}-${i}`, 100-i);
    }
    for (let i = 1; i <= 7; i++) {
      sql.prepare("INSERT INTO business_media(business_id,storage_key,file_url,media_type) VALUES(?,?,?,'video')").run(businessId, `video-${i}`, `/video-${businessId}-${i}`);
    }
  }
  sql.exec("INSERT INTO business_media(business_id,storage_key,file_url,kind) VALUES(1,'cover','/cover','cover'),(1,'cover2','/cover2','cover'),(1,'logo','/logo','logo');");
}

test('Grouped hydration preserves per-business details, ordering and entitlements', async () => {
  const f = fixture(); seedDetails(f.sql);
  const rows = plain(await f.api.listPublishedBusinesses());
  // Ranking uses the existing Bayesian review score, not raw star average.
  assert.deepEqual(rows.map(row => row.id), [1, 2, 3]);
  const first = rows.find(row => row.id === 1), second = rows.find(row => row.id === 2);
  assert.equal(first.planCode, 'premium');
  assert.equal(first.rating, 4); assert.equal(first.reviewCount, 12);
  assert.deepEqual(first.reviews.map(review => review.id), [12,11,10,9,8,7,6,5]);
  assert.equal(first.reviews[0].reply, 'Reply');
  assert.deepEqual(first.hours.map(hour => hour.weekday), [1,2]);
  assert.equal(first.categories[0].slug, 'curtain'); assert.ok(first.services.length > 0);
  assert.equal(first.coverageNote, 'Coverage'); assert.deepEqual(first.serviceAreas, ['تمام کرج']);
  assert.equal(first.showInstallments, true); assert.equal(second.showInstallments, false);
  assert.equal(first.media.filter(media => media.kind === 'cover').length, 1);
  assert.equal(first.media.filter(media => media.kind === 'image').length, 90);
  assert.equal(first.media.filter(media => media.kind === 'video').length, 6);
  assert.equal(second.media.filter(media => media.kind === 'image').length, 10);
  assert.equal(second.media.filter(media => media.kind === 'video').length, 0);
  assert.equal(second.promoted, true); assert.equal(rows[2].promoted, false);
  assert.equal(second.reviewCount, 1); assert.equal(rows[2].reviewCount, 0);
  assert.deepEqual(plain(await f.api.getPublishedBusiness('booth-1')), first);
  f.sql.close();
});

test('50 and 100 business lists have constant relation-query count and bounded parameters', async () => {
  for (const count of [50,100]) {
    const f = fixture(count);
    const rows = await f.api.listPublishedBusinesses({limit: count});
    assert.equal(rows.length, count);
    assert.equal(f.stats.statements, 17);
    assert.equal(f.stats.calls, 8);
    assert.equal(f.stats.batches, 1);
    assert.equal(f.stats.maxBinds, count);
    f.sql.close();
  }
});

test('Empty, hidden and missing optional data do not leak or fail', async () => {
  const f = fixture();
  f.sql.exec("UPDATE businesses SET status='draft' WHERE id=1; INSERT INTO business_visibility_controls VALUES(2,1); DROP TABLE business_installment_options; DROP TABLE subscription_custom_capacity;");
  const rows = await f.api.listPublishedBusinesses();
  assert.deepEqual(Array.from(rows, row => row.id), [3]);
  assert.equal(rows[0].showInstallments, false);
  assert.equal(await f.api.getPublishedBusiness('booth-2'), null);
  const before = f.stats.batches;
  assert.equal((await f.api.listPublishedBusinesses({query: 'no-such-booth'})).length, 0);
  assert.equal(f.stats.batches, before);
  f.sql.close();
});
