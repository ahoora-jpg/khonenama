import { writeFileSync, mkdirSync } from 'node:fs';
const base = 'https://khonenama.ir';
let token = ''; const checks = [];
async function request(path, method = 'GET', data, auth = true) {
  const response = await fetch(base + path, { method, headers: { ...(auth && token ? { Authorization: 'Bearer ' + token } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(45000) });
  const body = await response.json().catch(() => null);
  checks.push({ path, method, status: response.status, error: body?.error }); console.log(path, method, response.status, body?.error || '');
  return { response, body };
}
const login = await request('/api/auth/business/login', 'POST', { phone: process.env.TEST_BUSINESS_PHONE, password: process.env.TEST_BUSINESS_PASSWORD }, false);
token = login.body?.accessToken;
if (!token) throw Error('Test login unavailable');
const owner = await request('/api/me/business');
if (!owner.body?.business?.name.includes('آزمایشی')) throw Error('Only fictional test business may be changed');
const slug = owner.body.business.slug;
try {
  for (const path of ['taxonomy', 'hours', 'analytics', 'reviews', 'albums', 'media', 'leads']) await request('/api/me/business/' + path);
  await request('/api/me/business/visibility', 'PATCH', { ownerPaused: false });
  const detail = await request('/api/v1/businesses/' + slug, 'GET', undefined, false);
  checks.push({ check: 'mobile-detail-gallery-and-album-contract', valid: Array.isArray(detail.body?.data?.media) && Array.isArray(detail.body?.data?.albums) });
  const lead = await request('/api/business/' + slug + '/lead', 'POST', { customerName: 'مشتری آزمایشی اپ', customerPhone: '09000000638', requestText: 'این درخواست فقط آزمون فنی اتصال اپ به سایت است؛ سفارش واقعی نیست.', area: 'آزمایشی', website: '' }, false);
  const leadId = Number(lead.body?.requestCode?.replace('KH-', ''));
  if (!Number.isSafeInteger(leadId) || leadId < 1) throw Error('Test request not created');
  const list = await request('/api/me/business/leads');
  checks.push({ check: 'owner-sees-customer-test-request', valid: list.body?.leads?.some(lead => lead.id === leadId) });
  await request('/api/me/business/leads', 'PATCH', { leadId, action: 'quote', message: 'پاسخ آزمایشی برای بررسی اتصال اپ؛ پیشنهاد تجاری واقعی نیست.' });
  await request('/api/me/business/leads', 'PATCH', { leadId, action: 'status', status: 'closed' });
} finally {
  await request('/api/me/business/visibility', 'PATCH', { ownerPaused: true });
  mkdirSync('outputs', { recursive: true }); writeFileSync('outputs/live-mobile-parity.json', JSON.stringify(checks, null, 2));
}
await request('/api/business/' + slug + '/lead', 'POST', { customerName: 'مشتری آزمایشی اپ', customerPhone: '09000000638', requestText: 'آزمون عدم دریافت درخواست در حالت توقف نمایش غرفه.', website: '' }, false);
writeFileSync('outputs/live-mobile-parity.json', JSON.stringify(checks, null, 2));
