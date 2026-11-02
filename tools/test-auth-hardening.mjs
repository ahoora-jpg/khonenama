import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,imports={}){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>{assert.ok(n in imports,n);return imports[n]},crypto:webcrypto,TextEncoder,Uint8Array,Request,Response,URL,Error,console});return exports;}
const passwords=load('lib/server/password.ts');
function fixture(){
  const sql=new DatabaseSync(':memory:');
  sql.exec('CREATE TABLE users(id TEXT,phone TEXT,status TEXT,password_hash TEXT,password_salt TEXT,password_iterations INTEGER); CREATE TABLE business_members(user_id TEXT,business_id INTEGER,status TEXT,joined_at TEXT);');
  const db={prepare(q){return{v:[],bind(...v){this.v=v;return this},async first(){return sql.prepare(q).get(...this.v)||null},async run(){return{meta:{changes:sql.prepare(q).run(...this.v).changes}}}}}};
  const route=load('app/api/auth/business/login/route.ts',{'cloudflare:workers':{env:{DB:db}},'@/lib/server/password':passwords,'@/lib/server/business-session':{createBusinessSession:async()=>({token:'synthetic-new-session',expiresAt:'future',cookie:'synthetic-cookie'})}});
  const request=(phone='09000000000',ip='192.0.2.1')=>new Request('https://khonenama.ir/api/auth/business/login',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':ip},body:JSON.stringify({phone,password:'wrong-password'})});
  return {sql,db,route,request};
}
test('Distributed attempts against one phone are bounded despite changing IP; no raw phone/IP in limiter storage',async()=>{
  const f=fixture();
  for(let i=0;i<10;i++)assert.equal((await f.route.POST(f.request(undefined,'192.0.2.'+i))).status,401);
  const blocked=await f.route.POST(f.request(undefined,'198.51.100.1'));
  assert.equal(blocked.status,429);assert.equal(blocked.headers.get('retry-after'),'900');
  const rows=f.sql.prepare('SELECT key_hash FROM auth_rate_limits').all();assert.ok(rows.every(r=>/^[a-f0-9]{64}$/.test(r.key_hash)));
});
test('Concurrent login failures increment atomically; stale windows reset',async()=>{
  const f=fixture();await Promise.all(Array.from({length:8},()=>f.route.POST(f.request())));
  assert.ok(f.sql.prepare('SELECT failures FROM auth_rate_limits').all().every(r=>r.failures===8));
  f.sql.exec("UPDATE auth_rate_limits SET window_started=datetime('now','-16 minutes')");
  assert.equal((await f.route.POST(f.request())).status,401);
  assert.ok(f.sql.prepare('SELECT failures FROM auth_rate_limits').all().every(r=>r.failures===1));
});
test('SQL injection login payload cannot select a user or create a session',async()=>{
  const f=fixture();const r=await f.route.POST(f.request("09' OR 1=1 --"));
  assert.equal(r.status,400);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM users').get().n,0);
});
test('Optional salted admin password disables plaintext signing-key login while retaining signed sessions',async()=>{
  const saved=await passwords.hashPassword('test-admin-password');
  const settings={ADMIN_ACCESS_KEY:'synthetic-signing-key',ADMIN_LOGIN_PASSWORD_HASH:['pbkdf2-sha256',saved.iterations,saved.salt,saved.hash].join('$')};
  const auth=load('lib/server/admin-session.ts',{'cloudflare:workers':{env:settings},'./password':passwords});
  assert.equal(await auth.verifyAdminAccessKey('test-admin-password'),true);
  assert.equal(await auth.verifyAdminAccessKey(settings.ADMIN_ACCESS_KEY),false);
  settings.ADMIN_LOGIN_PASSWORD_HASH='malformed';assert.equal(await auth.verifyAdminAccessKey('test-admin-password'),false);
});

test('Recovery throttling returns a bounded Retry-After without sensitive errors',async()=>{const route=load('app/api/auth/business/recovery/route.ts',{'cloudflare:workers':{env:{DB:{}}},'@/lib/server/password-recovery':{requestRecovery:async()=>{throw Error('TOO_MANY_ATTEMPTS')}}});const r=await route.POST(new Request('https://khonenama.ir/api/auth/business/recovery',{method:'POST',body:JSON.stringify({email:'synthetic@example.com',phone:'09000000000'})}));assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'3600');});
test('SMS extra-key throttling includes Retry-After and database failures fail closed',async()=>{let unavailable=false;const route=load('app/api/admin/sms/login/route.ts',{'@/lib/server/admin-session':{isAdminRequest:async()=>true},'@/lib/server/admin-login-rate-limit':{allowAdminLogin:async()=>{if(unavailable)throw Error('synthetic database failure');return false}},'@/lib/server/sms/admin-auth':{smsKeyConfigured:()=>true},'@/lib/server/sms/domain':{noStore:(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}})}});const req=()=>new Request('https://sms.khonenama.ir/api/admin/sms/login',{method:'POST',body:'{}'});const r=await route.POST(req());assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'900');unavailable=true;assert.equal((await route.POST(req())).status,503);});
