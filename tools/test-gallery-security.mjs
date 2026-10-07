import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';
import QRCode from 'qrcode';

function load(path, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in imports, name); return imports[name]; }, Response, Request, File, URL, TransformStream, crypto: webcrypto, console, Date, Set, Map, TextEncoder });
  return exports;
}
function fixture(plan = 'pro') {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec("PRAGMA foreign_keys=ON; CREATE TABLE businesses(id INTEGER PRIMARY KEY,slug TEXT,status TEXT); INSERT INTO businesses VALUES(1,'vendor','published'),(2,'other','draft'); CREATE TABLE business_visibility_controls(business_id INTEGER PRIMARY KEY,owner_paused INTEGER); CREATE TABLE business_media(id INTEGER PRIMARY KEY,business_id INTEGER REFERENCES businesses(id),file_url TEXT,alt_text TEXT,sort_order INTEGER); INSERT INTO business_media VALUES(1,1,'https://example.test/1.jpg','one',1),(2,2,'https://example.test/2.jpg','two',1); CREATE TABLE plans(id INTEGER PRIMARY KEY,code TEXT); INSERT INTO plans VALUES(1,'pro'),(2,'free'); CREATE TABLE subscriptions(id INTEGER PRIMARY KEY,business_id INTEGER,plan_id INTEGER,status TEXT,ends_at TEXT);");
  sqlite.prepare("INSERT INTO subscriptions VALUES(1,1,?,'active',NULL)").run(plan === 'pro' ? 1 : 2);
  const db = { prepare(sql) { return { values: [], bind(...values) { this.values = values; return this; }, async first() { return sqlite.prepare(sql).get(...this.values) || null; }, async all() { return { results: sqlite.prepare(sql).all(...this.values) }; }, async run() { return { meta: { changes: sqlite.prepare(sql).run(...this.values).changes } }; } }; }, async batch(statements) { sqlite.exec('BEGIN'); try { const results = []; for (const s of statements) results.push(await s.run()); sqlite.exec('COMMIT'); return results; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } } };
  const entitlements = load('lib/business-entitlements.ts');
  const albums = load('lib/server/business-albums.ts', { '@/lib/business-entitlements': entitlements });
  const route = load('app/api/me/business/albums/route.ts', { '@/lib/server/business-media': { getOwnedBusiness: async () => ({ db, business: { id: 1 } }) }, '@/lib/server/business-albums': albums });
  return { db, sqlite, route, albums };
}
function request(body, method = 'POST') { return new Request('https://khonenama.ir/api/me/business/albums', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
test('Free plan keeps ten photo slots while allowing album organization', async () => {
  const entitlements = load('lib/business-entitlements.ts'); assert.equal(entitlements.planPresentation.free.galleryLimit, 10);
  const { route } = fixture('free'); assert.equal((await route.POST(request({ title: 'Project', description: '', mediaIds: [1] }))).status, 201);
});
test('Album rejects another business photo without creating data', async () => {
  const { route, sqlite } = fixture(); assert.equal((await route.POST(request({ title: 'Project', description: '', mediaIds: [2] }))).status, 400);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM business_albums').get().n, 0);
});
test('Paid album saves its description and only its own selected photos', async () => {
  const { route, albums, db } = fixture(); const response = await route.POST(request({ title: 'Project', description: 'Real project details', mediaIds: [1, 1] })); assert.equal(response.status, 201);
  const data = await albums.listBusinessAlbums(db, 1); assert.equal(data.length, 1); assert.equal(data[0].description, 'Real project details'); assert.equal(data[0].media.length, 1);
});
test('Album count is unlimited and album editing cannot borrow another business photo', async () => {
  const { route, sqlite, albums, db } = fixture(); await albums.ensureAlbumSchema(db);
  for (let i = 1; i <= 4; i++) sqlite.prepare('INSERT INTO business_albums(id,business_id,title) VALUES(?,1,?)').run(i, 'existing');
  // D1 batches execute sequentially; both callers may read the same pre-batch state.
  const a = await route.POST(request({ title: 'Fifth', description: '', mediaIds: [1] }));
  const b = await route.POST(request({ title: 'Sixth', description: '', mediaIds: [1] }));
  assert.equal(a.status, 201); assert.equal(b.status, 201); assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM business_albums').get().n, 6);
  const {id}=await a.json();
  assert.equal((await route.PATCH(request({id,title:'Updated',description:'',mediaIds:[2]},'PATCH'))).status,400);
  assert.equal((await route.PATCH(request({id,title:'Updated',description:'',mediaIds:[1]},'PATCH'))).status,200);
  assert.equal(sqlite.prepare('SELECT title FROM business_albums WHERE id=?').get(id).title,'Updated');
  sqlite.prepare('INSERT INTO business_albums(id,business_id,title) VALUES(999,2,?)').run('other');
  assert.equal((await route.PATCH(request({id:999,title:'Updated',description:'',mediaIds:[1]},'PATCH'))).status,404);
});
test('Deleting another business album is denied; deleting own album preserves photos', async () => {
  const { route, sqlite, albums, db } = fixture(); await albums.ensureAlbumSchema(db);
  sqlite.exec("INSERT INTO business_albums(id,business_id,title) VALUES(10,2,'other'),(11,1,'own'); INSERT INTO business_album_media VALUES(11,1)");
  assert.equal((await route.DELETE(request({ id: 10 }, 'DELETE'))).status, 404);
  assert.equal((await route.DELETE(request({ id: 11 }, 'DELETE'))).status, 200);
  assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM business_media').get().n, 2); assert.equal(sqlite.prepare('SELECT COUNT(*) n FROM business_album_media').get().n, 0);
});
test('Gallery link follows current slug, hides paused and unpublished businesses', async () => {
  const { db, sqlite } = fixture(); const route = load('app/g/[id]/route.ts', { 'cloudflare:workers': { env: { DB: db } } });
  const get = id => route.GET(new Request('https://khonenama.ir/g/' + id), { params: Promise.resolve({ id }) });
  assert.equal((await get('1')).headers.get('location'), 'https://khonenama.ir/business/vendor#gallery');
  sqlite.exec("UPDATE businesses SET slug='changed' WHERE id=1"); assert.equal((await get('1')).headers.get('location'), 'https://khonenama.ir/business/changed#gallery');
  sqlite.exec('INSERT INTO business_visibility_controls VALUES(1,1)'); assert.equal((await get('1')).status, 404); assert.equal((await get('2')).status, 404); assert.equal((await get('1evil')).status, 404);
});
test('QR route requires ownership and encodes the stable business gallery address', async () => {
  let captured;
  const route = load('app/api/me/business/qr/route.ts', { qrcode: { toString: async (url, options) => { captured = url; return QRCode.toString(url, options); } }, '@/lib/server/business-media': { getOwnedBusiness: async () => ({ business: { id: 42 } }) } });
  const response = await route.GET(new Request('https://khonenama.ir/api/me/business/qr')); assert.equal(captured, 'https://khonenama.ir/g/42'); assert.match(await response.text(), /<svg/); assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const anonymous = load('app/api/me/business/qr/route.ts', { qrcode: QRCode, '@/lib/server/business-media': { getOwnedBusiness: async () => null } }); assert.equal((await anonymous.GET(new Request('https://khonenama.ir/api/me/business/qr'))).status, 401);
});
test('Cookie mutations from another origin fail before any database access', async () => {
  const session = load('lib/server/business-session.ts', { 'cloudflare:workers': { env: { DB: new Proxy({}, { get() { throw new Error('DB must not be accessed'); } }) } } });
  assert.equal(await session.getBusinessSession(new Request('https://khonenama.ir/api/me/business', { method: 'PATCH', headers: { origin: 'https://evil.example', cookie: 'khonenama_session=test' } })), null);
});
test('ISO session expiry expires at its actual time, not at the end of the day', () => {
  const sqlite = new DatabaseSync(':memory:'); assert.equal(sqlite.prepare("SELECT julianday('2026-10-01T01:00:00.000Z') > julianday('2026-10-01 02:00:00') AS valid").get().valid, 0);
});
test('Concurrent photo uploads cannot exceed ten portfolio photos and rejected uploads are removed', async () => {
  const { db, sqlite } = fixture('free');
  sqlite.exec("ALTER TABLE business_media ADD COLUMN kind TEXT; ALTER TABLE business_media ADD COLUMN storage_key TEXT; ALTER TABLE business_media ADD COLUMN provider TEXT; ALTER TABLE business_media ADD COLUMN provider_file_id TEXT; ALTER TABLE business_media ADD COLUMN file_path TEXT; ALTER TABLE business_media ADD COLUMN thumbnail_url TEXT; INSERT INTO business_media(id,business_id,file_url,sort_order) VALUES(3,1,'a',2),(4,1,'b',3),(5,1,'c',4),(6,1,'d',5)");
  sqlite.exec("UPDATE business_media SET kind='image'; INSERT INTO business_media(id,business_id,kind,file_url,sort_order) VALUES(7,1,'image','e',6),(8,1,'image','f',7),(9,1,'image','g',8),(10,1,'image','h',9),(11,1,'cover','cover',10),(12,1,'logo','logo',11)");
  const removed = []; let sequence = 0;
  const route = load('app/api/me/business/media/upload/route.ts', {
    '@/lib/business-entitlements': load('lib/business-entitlements.ts'),
    '@/lib/server/business-upload-form': load('lib/server/business-upload-form.ts'),
    '@/lib/server/business-media': { getOwnedBusiness: async () => ({ db, business: { id: 1 } }), ensureBusinessMediaSchema: async () => {} },
    '@/lib/server/business-media-storage': { mediaStorageConfigured: () => true, uploadStoredBusinessImage: async () => { const id = 'new' + (++sequence); return { provider: 'imagekit', fileId: id, filePath: '/khonenama/businesses/1/' + id, fileType: 'image', mime: 'image/jpeg', size: 4, url: 'https://example.test/' + id, thumbnailUrl: '' }; }, deleteStoredBusinessImage: async (_provider, id) => removed.push(id) },
  });
  const upload = (kind = "image") => { const form = new FormData(); form.set("kind", kind); form.set('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' })); return route.POST(new Request('https://khonenama.ir/api/me/business/media/upload', { method: 'POST', body: form })); };
  const responses = await Promise.all([upload(), upload()]);
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]); assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM business_media WHERE business_id=1 AND kind='image'").get().n, 10); assert.equal(removed.length, 1);
  // Cover and profile have independent single slots even with all ten portfolio slots used.
  sqlite.exec("DELETE FROM business_media WHERE id IN (11,12)");
  assert.equal((await upload('cover')).status, 201);
  assert.equal((await upload('logo')).status, 201);
  assert.equal((await upload('cover')).status, 201);
  assert.equal((await upload('logo')).status, 201);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM business_media WHERE business_id=1 AND kind='cover'").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM business_media WHERE business_id=1 AND kind='logo'").get().n, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM business_media WHERE business_id=1 AND kind='image'").get().n, 10);
});
test('Concurrent verified-payment callbacks activate a subscription exactly once', async () => {
  const { db, sqlite } = fixture();
  sqlite.exec("ALTER TABLE plans ADD COLUMN name TEXT; ALTER TABLE subscriptions ADD COLUMN starts_at TEXT; CREATE TABLE invoices(id INTEGER PRIMARY KEY,status TEXT,business_id INTEGER,plan_id INTEGER,paid_at TEXT,updated_at TEXT); CREATE TABLE payments(id INTEGER PRIMARY KEY,invoice_id INTEGER,status TEXT,provider_reference TEXT); CREATE TABLE payment_events(id INTEGER PRIMARY KEY,payment_id INTEGER,event_type TEXT,provider_code TEXT,payload_json TEXT); INSERT INTO invoices VALUES(1,'pending',1,1,NULL,NULL); INSERT INTO payments VALUES(1,1,'verified','ref')");
  const originalBatch = db.batch.bind(db); let pending = Promise.resolve();
  db.batch = statements => { const result = pending.then(() => originalBatch(statements)); pending = result.catch(() => {}); return result; };
  sqlite.exec("ALTER TABLE subscriptions ADD COLUMN is_test INTEGER DEFAULT 0; ALTER TABLE invoices ADD COLUMN total_amount INTEGER DEFAULT 100; ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'IRT'; ALTER TABLE payments ADD COLUMN amount INTEGER DEFAULT 100; ALTER TABLE payments ADD COLUMN currency TEXT DEFAULT 'IRT'; ALTER TABLE payments ADD COLUMN provider TEXT DEFAULT 'zarinpal'; CREATE TABLE billing_checkouts(payment_id INTEGER,business_id INTEGER,plan_code TEXT,amount_toman INTEGER,duration_days INTEGER,activation_ends_at TEXT); INSERT INTO billing_checkouts VALUES(1,1,'pro',100,30,NULL); CREATE TABLE billing_receipts(payment_id INTEGER,provider TEXT,reference TEXT); INSERT INTO billing_receipts VALUES(1,'zarinpal','ref');");
  const activation = load('lib/server/billing-activation.ts');
  const results = await Promise.all([activation.activateSubscriptionFromVerifiedPayment(db, 1), activation.activateSubscriptionFromVerifiedPayment(db, 1)]);
  assert.equal(results.filter(r => !r.idempotent).length, 1); assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM payment_events WHERE event_type='subscription_activated'").get().n, 1); assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM subscriptions WHERE status='active'").get().n, 1);
});
test('Admin login rate limit counts concurrent attempts atomically and resets an expired window', async () => {
  const { db, sqlite } = fixture();
  const limiter = load('lib/server/admin-login-rate-limit.ts', { 'cloudflare:workers': { env: { DB: db } } });
  const request = new Request('https://khonenama.ir/api/admin/login', { headers: { 'cf-connecting-ip': '192.0.2.1' } });
  const results = await Promise.all(Array.from({ length: 12 }, () => limiter.allowAdminLogin(request)));
  assert.equal(results.filter(Boolean).length, 10);
  sqlite.exec("UPDATE admin_login_rate_limits SET window_started=datetime('now','-16 minutes')"); assert.equal(await limiter.allowAdminLogin(request), true);
});
test('Public links reject script URLs, credentials and false Instagram domains', () => {
  const links = load('lib/public-links.ts');
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>', 'java\nscript:alert(1)', 'https://user:pass@example.com']) assert.equal(links.safeWebsiteUrl(value), '');
  assert.equal(links.safeWebsiteUrl('example.com'), 'https://example.com/');
  assert.equal(links.safeInstagramUrl('https://instagram.com.evil.example/profile'), '');
  assert.equal(links.safeInstagramUrl('@real_vendor'), 'https://www.instagram.com/real_vendor');
});

