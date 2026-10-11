import assert from 'node:assert/strict';
const base='https://www.khonenama.ir';
async function get(path){const response=await fetch(base+path,{signal:AbortSignal.timeout(20000),redirect:'follow'});assert.equal(response.status,200,path+' status');return response;}
for(const path of ['/','/register-business','/business/forgot-password','/favicon.ico']){await get(path);console.log('PASS public route',path);}
const recovery=await (await get('/api/auth/business/recovery')).json();
assert.equal(recovery.ok,true);assert.equal(recovery.available,true,'Recovery sender secret is not configured on production');console.log('PASS recovery configuration (email delivery not tested)');
for(const query of ['مینیمال','پرده مینیمال','کفپوش']){
 const result=await(await get('/api/v1/businesses?q='+encodeURIComponent(query))).json();assert.equal(result.ok,true);assert.ok(Array.isArray(result.data));
 for(const business of result.data){assert.ok(business.services.some(service=>service.replace(/[\s\u200c]+/g,'').includes(query.replace(/[\s\u200c]+/g,''))),'Unrelated service in public results');}
 console.log('PASS service query',query,'results',result.data.length);
 if(result.data[0])await get('/business/'+encodeURIComponent(result.data[0].slug));
}
console.log('Public smoke checks passed. Authenticated owner journeys, real payments and handset delivery remain separate tests.');
