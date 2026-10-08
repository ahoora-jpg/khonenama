import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { webcrypto } from 'node:crypto';

function load(path, imports, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in imports, name); return imports[name]; }, URL, Response, Request, Headers, File, AbortSignal, crypto: webcrypto, console, Uint8Array, Set, Number, ...globals });
  return exports;
}
function storageFixture({ mode = 'r2', failThumbnail = false, badFolder = false, badDimensions = false, externalUrl = false, oversizedDownload = false } = {}) {
  const objects = new Map();
  const deletedTemps = [];
  const bucket = {
    async put(key, bytes, metadata) { if (failThumbnail && key.endsWith('-thumb.webp')) throw new Error('write failed'); objects.set(key, { bytes, metadata }); },
    async delete(keys) { for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key); },
  };
  const api = load('lib/server/business-media-storage.ts', {
    'cloudflare:workers': { env: { MEDIA_STORAGE_PROVIDER: mode, BUSINESS_MEDIA: bucket, IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/khonenama' } },
    '@/lib/server/imagekit': {
      imageKitServerConfigured: () => true,
      uploadImageKitFile: async () => ({ fileId: 'temporary' }),
      getImageKitFileDetails: async () => ({ fileId: 'temporary', filePath: '/khonenama/businesses/' + (badFolder ? 2 : 1) + '/image.webp', fileType: 'image', mime: 'image/webp', size: 4, width: badDimensions ? 9000 : 2560, height: 1920, url: externalUrl ? 'https://untrusted.example/image.webp' : 'https://ik.imagekit.io/khonenama/image.webp' }),
      deleteImageKitFile: async id => deletedTemps.push(id),
    },
  }, { fetch: async () => new Response(oversizedDownload ? new Uint8Array(9 * 1024 * 1024) : new Uint8Array([1, 2, 3, 4]), { headers: { 'Content-Type': 'image/webp' } }) });
  const upload = () => api.uploadStoredBusinessImage(new File(['raw'], 'image.jpg', { type: 'image/jpeg' }), { folder: '/khonenama/businesses/1', fileName: 'image.jpg', businessId: 1 });
  return { api, upload, objects, deletedTemps };
}

test('R2 persists processed master and thumbnail, removes temporary encoder file', async () => {
  const f = storageFixture();
  const image = await f.upload();
  assert.equal(image.provider, 'r2');
  assert.match(image.fileId, /^businesses\/1\/[a-f0-9-]{36}\.webp$/);
  assert.equal(f.objects.size, 2);
  assert.equal(f.deletedTemps.length, 1);
  assert.equal(f.deletedTemps[0], 'temporary');
  assert.equal(image.url, 'https://khonenama.ir/media/' + image.fileId);
  await f.api.deleteStoredBusinessImage('r2', image.fileId);
  assert.equal(f.objects.size, 0);
});
test('Partial R2 writes leave no permanent or temporary orphan', async () => {
  const f = storageFixture({ failThumbnail: true });
  await assert.rejects(f.upload(), /write failed/);
  assert.equal(f.objects.size, 0);
  assert.equal(f.deletedTemps.length, 1);
});
test('Wrong business folder and unprocessed oversized dimensions are rejected', async () => {
  for (const options of [{ badFolder: true }, { badDimensions: true }]) {
    const f = storageFixture(options);
    await assert.rejects(f.upload(), /INVALID_MEDIA|MEDIA_PROCESSING_FAILED/);
    assert.equal(f.objects.size, 0);
    assert.equal(f.deletedTemps.length, 1);
  }
});
test('ImageKit mode preserves its permanent file and never writes R2', async () => {
  const f = storageFixture({ mode: 'imagekit' });
  const image = await f.upload();
  assert.equal(image.provider, 'imagekit');
  assert.equal(f.objects.size, 0);
  assert.equal(f.deletedTemps.length, 0);
  await f.api.deleteStoredBusinessImage('imagekit', image.fileId);
  assert.equal(f.deletedTemps[0], 'temporary');
});
test('R2 deletion rejects arbitrary paths', async () => {
  const f = storageFixture();
  await assert.rejects(f.api.deleteStoredBusinessImage('r2', '../other'), /INVALID_MEDIA_KEY/);
  await assert.rejects(f.api.deleteStoredBusinessImage('unknown-provider', 'temporary'), /INVALID_MEDIA_PROVIDER/);
});
test('Untrusted URLs and oversized downloads never persist to R2', async () => {
  for (const options of [{ externalUrl: true }, { oversizedDownload: true }]) {
    const f = storageFixture(options);
    await assert.rejects(f.upload(), /INVALID_MEDIA|FILE_TOO_LARGE/);
    assert.equal(f.objects.size, 0);
    assert.equal(f.deletedTemps.length, 1);
  }
});

function servingFixture({ published = true, paused = false, owner = false, registered = true } = {}) {
  let reads = 0;
  const db = { prepare(sql) { return { bind() { return this; }, async first() { return sql.includes('business_members') ? (owner ? { allowed: 1 } : null) : (registered ? { status: published ? 'published' : 'draft', owner_paused: paused ? 1 : 0 } : null); } }; } };
  const object = () => { reads++; return { body: new Uint8Array([1, 2]), size: 2, httpEtag: '"test"' }; };
  const route = load('app/media/businesses/[businessId]/[fileName]/route.ts', {
    'cloudflare:workers': { env: { DB: db, BUSINESS_MEDIA: { get: async () => object(), head: async () => object() } } },
    '@/lib/business-video': {VIDEO_LIMITS:{free:0,pro:2,premium:5}},
    '@/lib/business-entitlements': {normalizePlanCode:value=>value==='pro'||value==='premium'?value:'free'},
    '@/lib/server/business-session': { getBusinessSession: async () => owner ? { user_id: 9 } : null },
  });
  const serve = (method = 'GET', headers = {}) => route[method](new Request('https://khonenama.ir/media/businesses/1/00000000-0000-4000-8000-000000000001.webp', { method, headers }), { params: Promise.resolve({ businessId: '1', fileName: '00000000-0000-4000-8000-000000000001.webp' }) });
  return { serve, reads: () => reads };
}
test('Published R2 images support GET, HEAD and conditional requests', async () => {
  const f = servingFixture();
  assert.equal((await f.serve()).status, 200);
  assert.equal((await f.serve('HEAD')).body, null);
  assert.equal((await f.serve('GET', { 'if-none-match': '"test"' })).status, 304);
});
test('Draft, paused and unregistered objects cannot be read by public visitors', async () => {
  for (const options of [{ published: false }, { paused: true }, { registered: false }]) {
    const f = servingFixture(options);
    assert.equal((await f.serve()).status, 404);
    assert.equal(f.reads(), 0);
  }
});
test('Owner draft previews are private and never cacheable', async () => {
  const f = servingFixture({ published: false, owner: true });
  const response = await f.serve();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
