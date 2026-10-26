import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const script=readFileSync('public/image-rescue.js','utf8').replace(/\r\n/g,'\n');
const original=readFileSync('public/images/editorial/photo-1602612996819-3cd306f68b4e.webp');

test('the bundled inline payload is exactly the tested script and cannot terminate its HTML element',()=>{
  const generated=readFileSync('lib/image-rescue-source.ts','utf8');
  const payload=JSON.parse(generated.match(/export const imageRescueSource = ([\s\S]*);\s*$/)[1]);
  assert.equal(payload,script);
  assert.doesNotMatch(payload,/<\/script/i);
});

function fixture(alwaysFail=false,debug=false){
  const calls=[];let blob,resolveDone;
  const elements=new Map();
  const done=new Promise(resolve=>resolveDone=resolve);
  const source='/images/editorial/photo-1602612996819-3cd306f68b4e.webp';
  class Image {
    isConnected=true;complete=false;naturalWidth=0;
    attrs=new Map([['src',source],['srcset',source+' 1x']]);
    getAttribute(name){return this.attrs.get(name)||null;}
    removeAttribute(name){this.attrs.delete(name);}
    setAttribute(name,value){this.attrs.set(name,value);}
    set src(value){
      if(value.startsWith('data:'))assert.equal(this.attrs.has('srcset'),false,'srcset must not keep stalled transfer alive');
      this.attrs.set('src',value);
      if(value==='blob:restored')resolveDone();
    }
  }
  const image=new Image();
  class BrowserURL extends URL {
    static createObjectURL(value){blob=value;return 'blob:restored';}
    static revokeObjectURL(){}
  }
  vm.runInNewContext(script,{
    URL:BrowserURL,Blob,AbortSignal,HTMLImageElement:Image,location:{href:'https://khonenama.ir/'+(debug?'?imageDebug=1':'')},
    document:{readyState:'loading',documentElement:{},body:{appendChild:el=>elements.set(el.id,el)},
      getElementById:id=>elements.get(id),createElement:()=>({style:{},setAttribute(){}}),
      querySelectorAll:()=>[image],addEventListener(){throw Error('DOMContentLoaded must not be required');}},
    IntersectionObserver:class{constructor(cb){this.cb=cb;}observe(target){queueMicrotask(()=>this.cb([{isIntersecting:true,target}]));}unobserve(){}},
    MutationObserver:class{observe(){}},
    setTimeout:(fn,ms)=>ms>=60000?0:setTimeout(fn,0),clearTimeout,queueMicrotask,
    fetch:async(url,options)=>{
      assert.equal(options.credentials,'omit');
      const index=Number(new URL(url,'https://khonenama.ir').searchParams.get('index'));
      calls.push(index);
      if(alwaysFail||calls.length===1){
        if(alwaysFail&&calls.length===6)setTimeout(resolveDone,30);
        return new Response(null,{status:503});
      }
      return new Response(original.subarray(index*48000,(index+1)*48000),{headers:{'X-Chunk-Index':String(index),'X-Image-Length':String(original.length)}});
    },
  });
  return {done,calls,image,source,blob:()=>blob,debugText:()=>elements.get('khonenama-image-debug')?.textContent};
}

test('recovery starts without DOMContentLoaded and reconstructs exact bytes after a transient failure',async()=>{
  const f=fixture(false,true);
  await Promise.race([f.done,new Promise((_,reject)=>setTimeout(()=>reject(Error('recovery did not finish')),2000).unref())]);
  assert.equal(f.image.getAttribute('src'),'blob:restored');
  assert.deepEqual(Buffer.from(await f.blob().arrayBuffer()),original);
  assert.equal(f.calls.filter(i=>i===0).length,2);
  assert.equal(f.calls.length,Math.ceil(original.length/48000)+1);
  assert.match(f.debugText(),/بازسازی‌شده: 1/);
});

test('persistent failure retries finitely and restores the original source and srcset',async()=>{
  const f=fixture(true);
  await Promise.race([f.done,new Promise((_,reject)=>setTimeout(()=>reject(Error('retry limit not reached')),2000).unref())]);
  assert.equal(f.calls.length,6);
  assert.equal(f.image.getAttribute('src'),f.source);
  assert.equal(f.image.getAttribute('srcset'),f.source+' 1x');
});
