// Run from GitHub Actions, with the existing deployment credential kept in memory.
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!account || !token) throw new Error('Missing Cloudflare credentials');
const base = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets`;
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
// Print only public token metadata, never the credential or API response body.
const verification = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', { headers });
const verified = await verification.json();
console.log('Deployment token verification:', JSON.stringify({ http: verification.status, success: verified.success === true, id: verified.result?.id, status: verified.result?.status }));
const list = await fetch(base, { headers });
const listed = await list.json();
if (!list.ok || !listed.success) throw new Error(`Cannot access R2: HTTP ${list.status}; ${JSON.stringify(listed.errors)}`);
const name = 'khonenama-business-media';
if ((listed.result?.buckets || []).some(bucket => bucket.name === name)) {
  console.log('R2 bucket already exists:', name);
} else {
  const created = await fetch(base, { method: 'POST', headers, body: JSON.stringify({ name, storage_class: 'Standard' }) });
  const result = await created.json();
  if (!created.ok || !result.success) throw new Error(`Cannot create R2 bucket: HTTP ${created.status}; ${JSON.stringify(result.errors)}`);
  console.log('Created private R2 bucket:', name);
}
