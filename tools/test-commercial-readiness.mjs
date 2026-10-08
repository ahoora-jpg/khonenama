import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadRoute(path, imports) {
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => {
    assert.ok(name in imports, `Unexpected dependency: ${name}`);
    return imports[name];
  }, Response, console, Date, Set });
  return exports;
}

for (const status of ['draft', 'pending', 'suspended', 'published']) {
  test(`Reading a complete ${status} profile never changes its publication status`, async () => {
    const queries = [];
    const db = { prepare(sql) {
      queries.push(sql);
      return {
        bind() { return this; },
        async first() {
          if (sql.startsWith('SELECT b.id, b.slug')) return { id: 1, slug: 'real-vendor', name: 'Vendor', description: 'Complete description', city: 'City', area: 'Area', address: 'Address', phone: 'Phone', status };
          return { count: 0 };
        },
        async all() { return { results: [{ id: 1 }] }; },
        async run() { return {}; },
      };
    } };
    const route = loadRoute('app/api/me/business/route.ts', {
      'cloudflare:workers': { env: { DB: db } },
      '@/lib/server/business-session': { getBusinessSession: async () => ({ user_id: 'owner' }) },
      '@/lib/business-slug': { createUniqueBusinessSlug: async () => 'real-vendor' },
      '@/lib/server/conversion-metrics': { recordConversion: async () => {} },
    });
    const response = await route.GET(new Request('https://khonenama.ir/api/me/business'));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).business.status, status);
    assert.ok(!queries.some((sql) => sql.startsWith('UPDATE businesses')));
  });
}

test('Readiness denies anonymous callers before accessing infrastructure', async () => {
  const route = loadRoute('app/api/admin/readiness/route.ts', {
    'cloudflare:workers': { env: new Proxy({}, { get() { throw new Error('Infrastructure accessed before authorization'); } }) },
    '@/lib/server/admin-session': { isAdminRequest: async () => false },
    '@/lib/server/imagekit': { getImageKitConfig: () => { throw new Error('Secret inspected before authorization'); } },
    '@/lib/server/payment-provider': { paymentProvider: () => null },
    '@/lib/business-plans': { businessPlans: [] },
  });
  const response = await route.GET(new Request('https://khonenama.ir/api/admin/readiness'));
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('Readiness reports missing schema and never declares unfinished payments ready', async () => {
  const route = loadRoute('app/api/admin/readiness/route.ts', {
    'cloudflare:workers': { env: { DB: { prepare: () => ({ all: async () => ({ results: [{ name: 'businesses' }] }) }) } } },
    '@/lib/server/admin-session': { isAdminRequest: async () => true },
    '@/lib/server/imagekit': { getImageKitConfig: () => ({ privateKey: 'private-test-value', urlEndpoint: 'https://example.test' }) },
    '@/lib/server/payment-provider': { paymentProvider: () => null },
    '@/lib/business-plans': { businessPlans: [{ code: 'pro', amountToman: null, purchasable: false }] },
  });
  const response = await route.GET(new Request('https://khonenama.ir/api/admin/readiness'));
  const body = await response.json();
  assert.ok(body.database.missingTables.includes('payments'));
  assert.equal(body.billing.readyForRealPayments, false);
  assert.ok(!JSON.stringify(body).includes('private-test-value'));
});

