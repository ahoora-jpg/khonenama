import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import ts from 'typescript';

function load(path, imports={}) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports,require:n=>{assert.ok(n in imports,n);return imports[n]},crypto:webcrypto,TextEncoder,Uint8Array,DataView,Request,Response,URL,btoa,console});
  return exports;
}
const {safeJsonLd}=load('lib/safe-json-ld.ts');
test('JSON-LD escapes script breakouts, HTML metacharacters and Unicode separators without corrupting data',()=>{
  const value={name:'</script><script>alert(1)</script>',review:'<svg onload=alert(1)>',url:'javascript:alert(1)',text:'&<>\u2028\u2029'};
  const result=safeJsonLd(value);
  assert.ok(!/[<>&\u2028\u2029]/.test(result));
  assert.deepEqual(JSON.parse(result),value);
});
test('All JSON-LD script sinks use the central serializer',()=>{
  const files=execFileSync('git',['ls-files','app','components'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(p=>/\.tsx$/.test(p));
  for(const p of files){const s=readFileSync(p,'utf8');for(const line of s.split('\n').filter(l=>l.includes('dangerouslySetInnerHTML')&&l.includes('ld+json')))assert.ok(line.includes('safeJsonLd('),p);}
});
test('Corrupt PBKDF2 parameters fail closed before expensive derivation',async()=>{
  const {hashPassword,verifyPassword}=load('lib/server/password.ts');
  const saved=await hashPassword('valid-password');
  assert.equal(await verifyPassword('valid-password',saved.hash,saved.salt,saved.iterations),true);
  for(const n of [0,-1,1.5,100001,Infinity])assert.equal(await verifyPassword('valid-password',saved.hash,saved.salt,n),false);
  assert.equal(await verifyPassword('valid-password','bad',saved.salt,100000),false);
  assert.equal(await verifyPassword('wrong-password',saved.hash,saved.salt,100000),false);
});
test('Admin login creates distinct bounded secure sessions and rejects tampering / extra segments',async()=>{
  const auth=load('lib/server/admin-session.ts',{'./password':load('lib/server/password.ts'),'cloudflare:workers':{env:{ADMIN_ACCESS_KEY:'synthetic-admin-key-for-tests-only'}}});
  const a=await auth.createAdminCookie(),b=await auth.createAdminCookie();
  assert.notEqual(a,b);
  for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/','Max-Age=43200'])assert.ok(a.includes(flag));
  const cookie=a.split(';')[0],req=value=>new Request('https://khonenama.ir/api/admin/test',{headers:{cookie:value}});
  assert.equal(await auth.isAdminRequest(req(cookie)),true);
  assert.equal(await auth.isAdminRequest(req(cookie+'x')),false);
  assert.equal(await auth.isAdminRequest(req(cookie+'.extra')),false);
  assert.equal(await auth.isAdminRequest(new Request('https://khonenama.ir/api/admin/test',{method:'POST',headers:{cookie,origin:'https://evil.example'}})),false);
});
test('Readiness exposes states only and rejects short or missing essential credentials',()=>{
  const {securityReadiness}=load('lib/server/security-readiness.ts');
  const settings={SMS_ROLE:'panel',ADMIN_ACCESS_KEY:'a'.repeat(32),SMS_INTERNAL_TOKEN:'b'.repeat(32),SMS_BRIDGE_TOKEN:'c'.repeat(32)};
  assert.equal(securityReadiness(settings).ready,true);
  const encoded=JSON.stringify(securityReadiness(settings));
  for(const value of Object.values(settings).filter(v=>v.length===32))assert.ok(!encoded.includes(value));
  assert.equal(securityReadiness({...settings,SMS_BRIDGE_TOKEN:'short'}).ready,false);
});
test('Image preflight rejects SVG/HTML spoofing and truncated AVIF boxes',()=>{
  const {imageSignatureMatches:matches}=load('lib/server/image-signature.ts');
  const b=s=>new TextEncoder().encode(s);
  assert.equal(matches(b('<svg onload="alert(1)"></svg>'),'image/png'),false);
  assert.equal(matches(b('<html>not a photo</html>'),'image/jpeg'),false);
  assert.equal(matches(b('RIFFxxxxWEBPxxxx'),'image/webp'),true);
  assert.equal(matches(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]),'image/png'),true);
  assert.equal(matches(b('xxxxftypavifxxxx'),'image/avif'),false);
  assert.equal(matches(b('GIF89a0000000000'),'image/gif'),true);
});

test('Worker early returns enforce HTTPS and private admin headers without changing API bodies',async()=>{
 const policy=load('lib/request-security.ts');const events=[];
 const {secureWorkerResponse}=load('lib/server/response-security.ts',{'../request-security':policy,'./security-audit':{securityAudit:(...args)=>events.push(args)}});
 let called=false;const redirected=await secureWorkerResponse(new Request('http://sms.khonenama.ir/api/v1/sms/bridge'),async()=>{called=true;return new Response('wrong')});
 assert.equal(redirected.status,308);assert.equal(called,false);
 const result=await secureWorkerResponse(new Request('https://sms.khonenama.ir/api/admin/sms/control',{method:'POST'}),async()=>Response.json({ok:true}));
 assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal(result.headers.get('x-robots-tag'),'noindex, nofollow');assert.equal(result.headers.get('x-content-type-options'),'nosniff');assert.equal(result.headers.get('access-control-allow-origin'),null);assert.deepEqual(await result.json(),{ok:true});assert.equal(events[0][0],'admin_mutation');
});
test('Candidate CSP rejects malformed nonces and never enables script unsafe-inline or unsafe-eval',()=>{
 const {reportOnlyCsp}=load('lib/request-security.ts');const value=reportOnlyCsp('a'.repeat(32));
 for(const directive of ['default-src','script-src','style-src','img-src','font-src','connect-src','frame-src','object-src','base-uri','form-action','frame-ancestors'])assert.ok(value.includes(directive));
 assert.ok(!value.includes('unsafe-eval'));assert.ok(!value.split(';').find(s=>s.trim().startsWith('script-src')).includes('unsafe-inline'));assert.throws(()=>reportOnlyCsp("bad'nonce"));
});

test('Security audit covers business login, recovery, upload, payment and configuration without passing payloads',async()=>{const policy=load('lib/request-security.ts');const events=[];const {secureWorkerResponse}=load('lib/server/response-security.ts',{'../request-security':policy,'./security-audit':{securityAudit:(...args)=>events.push(args)}});for(const [path,status,event] of [['/api/auth/business/login',401,'login'],['/api/auth/business/recovery',200,'password_recovery'],['/api/me/business/media/upload',415,'upload_reject'],['/api/billing/reconcile',409,'payment_verification'],['/api/admin/security-readiness',503,'secret_configuration']]){await secureWorkerResponse(new Request('https://khonenama.ir'+path),async()=>Response.json({ok:false},{status}));assert.equal(events.at(-1)[0],event);assert.equal(events.at(-1).length,3);}});
