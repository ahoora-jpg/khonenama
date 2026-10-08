import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, imports = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
    exports, require:name=>{assert.ok(name in imports,name);return imports[name];}, Response, Request, File, Headers, URL, TransformStream, Uint8Array, DataView, BigInt, crypto:webcrypto, console,
  });
  return exports;
}
const video=load('lib/business-video.ts');
const plans=load('lib/business-entitlements.ts');
function box(type, payload) {const out=Buffer.alloc(8+payload.length);out.writeUInt32BE(out.length);out.write(type,4);payload.copy(out,8);return out;}
function sample(seconds=20,trackSeconds=seconds) {
  const header=value=>{const b=Buffer.alloc(24);b.writeUInt32BE(1000,12);b.writeUInt32BE(value*1000,16);return b;};
  return Buffer.concat([box('ftyp',Buffer.from('isom0000')),box('moov',Buffer.concat([box('mvhd',header(seconds)),box('trak',box('mdia',Buffer.concat([box('mdhd',header(trackSeconds)),box('hdlr',Buffer.concat([Buffer.alloc(8),Buffer.from('vide')]))])))])),box('mdat',Buffer.from('test'))]);
}
test('Video validates movie and track duration independently, rejects malformed files',()=>{
  assert.equal(video.mp4Duration(sample()),20);
  assert.throws(()=>video.mp4Duration(sample(21)),/VIDEO_TOO_LONG/);
  assert.throws(()=>video.mp4Duration(sample(10,25)),/VIDEO_TOO_LONG/);
  assert.throws(()=>video.mp4Duration(Buffer.from('not a video')),/INVALID_VIDEO/);
  const broken=sample();broken.writeUInt32BE(999999);assert.throws(()=>video.mp4Duration(broken),/INVALID_VIDEO/);
});
test('Premium retains seventy photos, independent video allowance; downgrade hides videos without deleting',()=>{
  const life=load('lib/subscription-lifecycle.ts',{'./business-entitlements':plans});
  const media=[...Array.from({length:80},(_,i)=>({id:i+1,kind:'image'})),...Array.from({length:8},(_,i)=>({id:100+i,kind:'video'})),{id:200,kind:'cover'},{id:201,kind:'logo'}];
  for(const [code,photos,videos] of [['free',10,0],['pro',30,2],['premium',70,5]]){
    const result=life.selectPublicMedia(media,code);assert.equal(result.filter(m=>m.kind==='image').length,photos);assert.equal(result.filter(m=>m.kind==='video').length,videos);assert.equal(result.length,photos+videos+2);
  }
  assert.equal(media.length,90);
});
function fixture(code='pro') {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec("CREATE TABLE business_media(id INTEGER PRIMARY KEY,business_id INTEGER,kind TEXT,media_type TEXT DEFAULT 'image',storage_key TEXT,provider TEXT,provider_file_id TEXT,file_url TEXT,file_path TEXT,sort_order INTEGER); CREATE TABLE plans(id INTEGER PRIMARY KEY,code TEXT); CREATE TABLE subscriptions(id INTEGER PRIMARY KEY,business_id INTEGER,plan_id INTEGER,status TEXT,ends_at TEXT); INSERT INTO plans VALUES(1,'"+code+"'); INSERT INTO subscriptions VALUES(1,1,1,'active',NULL);");
  const db={prepare(sql){return {values:[],bind(...v){this.values=v;return this;},async first(){return sqlite.prepare(sql).get(...this.values)||null;}};}};
  const objects=new Map(); const bucket={async put(key,bytes){objects.set(key,bytes);},async delete(key){objects.delete(key);}};
  const route=load('app/api/me/business/media/upload/route.ts',{
    'cloudflare:workers':{env:{BUSINESS_MEDIA:bucket}},'@/lib/business-video':video,'@/lib/business-entitlements':plans,
    '@/lib/server/business-media':{getOwnedBusiness:async()=>({db,business:{id:1}}),ensureBusinessMediaSchema:async()=>{}},
    '@/lib/server/business-upload-form':load('lib/server/business-upload-form.ts'),
    '@/lib/server/business-media-storage':{mediaStorageConfigured:()=>true},
  });
  const upload=(bytes=sample(),mime='video/mp4')=>{const form=new FormData();form.set('kind','video');form.set('file',new File([bytes],'clip.mp4',{type:mime}));return route.POST(new Request('https://khonenama.ir/upload',{method:'POST',body:form}));};
  return {upload,sqlite,objects};
}
test('Free rejects video; malformed, long and oversized paid uploads never enter storage',async()=>{
  const free=fixture('free');assert.equal((await free.upload()).status,403);assert.equal(free.objects.size,0);
  const paid=fixture();assert.equal((await paid.upload(sample(25))).status,422);assert.equal((await paid.upload(Buffer.from('bad'))).status,422);assert.equal((await paid.upload(sample(),'image/jpeg')).status,415);assert.equal((await paid.upload(Buffer.alloc(15*1024*1024+1))).status,413);assert.equal(paid.objects.size,0);
});
test('Concurrent paid video uploads enforce separate quota and clean rejected objects',async()=>{
  const f=fixture();const responses=await Promise.all([f.upload(),f.upload(),f.upload()]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,201,409]);assert.equal(f.objects.size,2);assert.equal(f.sqlite.prepare("SELECT COUNT(*) n FROM business_media WHERE media_type='video'").get().n,2);
});
test('Whole-city and cross-city coverage are preserved independently of shop city',()=>{
  const areas=load('lib/service-area.ts');assert.equal(areas.parseServiceArea('تمام تهران','کرج').city,'تهران');assert.equal(areas.parseServiceArea('تهران / سعادت‌آباد','کرج').area,'سعادت‌آباد');assert.equal(areas.parseServiceArea('گوهردشت','کرج').city,'کرج');
  const taxonomy=load('lib/business-taxonomy.ts');const curtain=taxonomy.BUSINESS_CATEGORIES.find(c=>c.slug==='curtain');assert.ok(curtain.services.includes('میل‌پرده مینیمال'));assert.ok(curtain.services.includes('سرمیل‌پرده'));assert.equal(curtain.services.indexOf('میل‌پرده'),37);
});

test('Search SQL finds whole-city vendors across cities without mixing same-name neighborhoods',()=>{
  const sqlite=new DatabaseSync(':memory:');sqlite.exec("CREATE TABLE businesses(id INTEGER,city TEXT,area TEXT);CREATE TABLE business_service_areas(business_id INTEGER,city TEXT,area TEXT);INSERT INTO businesses VALUES(1,'کرج','آزمایشی'),(2,'تهران','دیگر'),(3,'شیراز','سعادت‌آباد');INSERT INTO business_service_areas VALUES(1,'تهران','تمام تهران'),(1,'کرج','تمام کرج'),(2,'تهران','سعادت‌آباد');");
  const source=readFileSync('lib/server/public-businesses.ts','utf8');
  const expressions=[...source.matchAll(/where.push\(("(?:[^"\\]|\\.)*")\);/g)].map(match=>JSON.parse(match[1]));
  const find=fragment=>expressions.find(sql=>sql.includes(fragment));
  const ids=(sql,args)=>sqlite.prepare('SELECT id FROM businesses b WHERE '+sql+' ORDER BY id').all(...args).map(row=>row.id);
  assert.deepEqual(ids(find('business_service_areas sc'),['%تهران%','%تهران%']),[1,2]);
  assert.deepEqual(ids(find('business_service_areas sl'),['تهران','%سعادت‌آباد%','تهران','%سعادت‌آباد%']),[1,2]);
  assert.deepEqual(ids(find('business_service_areas bsa WHERE'),['%گوهردشت%','%گوهردشت%','کرج']),[1]);
  assert.deepEqual(ids(find('business_service_areas bsa2'),['%تهران%','%تهران%','%تهران%','%تهران%','']),[1,2]);
});

test('Video serving supports mobile byte ranges and hides expired videos from visitors',async()=>{
  const key='businesses/1/00000000-0000-4000-8000-000000000001.mp4';
  let code='pro',owner=false,observedRange;
  const bytes=new Uint8Array([1,2,3,4,5,6]);
  const db={prepare(sql){return {bind(){return this;},async first(){if(sql.includes('business_members'))return owner?{allowed:1}:null;if(sql.includes('subscriptions'))return {code};return {status:'published',owner_paused:0};},async all(){return {results:code==='free'?[]:[{storage_key:key}]};}};}};
  const bucket={async head(){return {size:6,httpEtag:'"video"'};},async get(_key,options){observedRange=options?.range;return {size:6,httpEtag:'"video"',body:options?.range?bytes.slice(options.range.offset,options.range.offset+options.range.length):bytes};}};
  const route=load('app/media/businesses/[businessId]/[fileName]/route.ts',{'cloudflare:workers':{env:{DB:db,BUSINESS_MEDIA:bucket}},'@/lib/business-video':video,'@/lib/business-entitlements':plans,'@/lib/server/business-session':{getBusinessSession:async()=>owner?{user_id:1}:null}});
  const serve=(range,method='GET')=>route[method](new Request('https://khonenama.ir/media/'+key,{method,headers:range?{range}:{}}),{params:Promise.resolve({businessId:'1',fileName:key.split('/').pop()})});
  const ranged=await serve('bytes=1-3');assert.equal(ranged.status,206);assert.equal(ranged.headers.get('content-range'),'bytes 1-3/6');assert.equal(ranged.headers.get('content-length'),'3');assert.deepEqual([...new Uint8Array(await ranged.arrayBuffer())],[2,3,4]);assert.equal(observedRange.offset,1);
  assert.equal((await serve('bytes=-2')).headers.get('content-range'),'bytes 4-5/6');assert.equal((await serve('bytes=100-')).status,416);assert.equal((await serve('bytes=-')).status,416);
  assert.equal((await serve(null,'HEAD')).headers.get('content-type'),'video/mp4');code='free';assert.equal((await serve()).status,404);owner=true;assert.equal((await serve()).headers.get('cache-control'),'private, no-store');
});
