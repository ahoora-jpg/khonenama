import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync('lib/server/payment-provider.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,AbortSignal,Error});
const settings={PAYMENTS_ENABLED:'true',PAYMENT_PROVIDER:'zarinpal',ZARINPAL_MERCHANT_ID:'11111111-1111-1111-1111-111111111111'};
test('Provider requests use Workers-compatible manual redirect mode',async()=>{
  const provider=exports.paymentProvider(settings,async(url,options)=>{
    assert.equal(options.redirect,'manual');
    // Cloudflare rejects redirect:error before any request is sent.
    if(!['manual','follow'].includes(options.redirect))throw new TypeError('Invalid redirect value');
    return Response.json({data:{code:100,authority:'A'+'x'.repeat(35)}});
  });
  const result=await provider.request({amountRial:10000,callbackUrl:'https://example.test/callback',description:'Offline test'});
  assert.equal(result.authority,'A'+'x'.repeat(35));
});
test('An upstream redirect is rejected rather than followed with credentials',async()=>{
  const provider=exports.paymentProvider(settings,async(_url,options)=>{
    assert.equal(options.redirect,'manual');return new Response(null,{status:302,headers:{Location:'https://untrusted.example'}});
  });
  await assert.rejects(provider.request({amountRial:10000,callbackUrl:'https://example.test',description:'Offline test'}),/PAYMENT_NETWORK_ERROR/);
});
test('Email, media and notification transport does not reintroduce unsupported redirect mode',()=>{
  for(const file of ['lib/server/password-recovery.ts','lib/server/business-media-storage.ts','lib/server/business-web-push.ts','app/api/me/business/notifications/test/route.ts'])assert(!/redirect\s*:\s*["']error["']/.test(readFileSync(file,'utf8')),file);
});
