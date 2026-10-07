import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, writeFileSync } from 'node:fs';
const run = promisify(execFile), origin = 'https://khonenama.ir';
const queue = new Set([origin+'/', origin+'/sitemap.xml', origin+'/admin/login', origin+'/dashboard']);
const results = new Map(), refs = new Map(), anchors = [];
const external = new Set();
function add(raw, parent) {
  try {
    if (/[<>]/.test(raw)) return;
    const url = new URL(raw.replaceAll('&amp;', '&'), parent);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (!['khonenama.ir','www.khonenama.ir'].includes(url.hostname)) { external.add(url.href); return; }
    url.hostname='khonenama.ir'; url.protocol='https:';
    if(url.hash && url.hash!=='#') anchors.push({url:url.href, parent});
    url.hash='';
    if(url.pathname.startsWith('/api/')) return;
    if(!refs.has(url.href)) refs.set(url.href,new Set()); refs.get(url.href).add(parent);
    if(!results.has(url.href)) queue.add(url.href);
  } catch {}
}
async function request(url, head=false) {
  const args=['--http1.1','--compressed','--silent','--show-error','--location','--max-time','25','--write-out','\n__STATUS__%{http_code}__URL__%{url_effective}',...(head?['--head']:[]),url];
  for(let attempt=0;attempt<2;attempt++) try {
    const {stdout}=await run('curl.exe',args,{maxBuffer:12*1024*1024});
    const match=stdout.match(/\n__STATUS__(\d+)__URL__(.*)$/);
    return {status:Number(match?.[1]),finalUrl:match?.[2],html:stdout.slice(0,match?.index)};
  } catch(e) { if(attempt===1) return {error:e.stderr?.trim()||e.message}; }
}
while(queue.size) {
  const batch=[...queue].slice(0,6); batch.forEach(u=>queue.delete(u));
  await Promise.all(batch.map(async url=>{
    const asset=/\.(apk|pdf|png|jpe?g|webp|svg|woff2?)(?:$)/i.test(new URL(url).pathname);
    const row=await request(url,asset); results.set(url,{url,...row});
    if(row.status===200 && !asset){
      for(const m of row.html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) add(m[1],url);
      if(url.endsWith('/sitemap.xml')) for(const m of row.html.matchAll(/<loc>(.*?)<\/loc>/g)) add(m[1],url);
    }
  }));
  mkdirSync('outputs',{recursive:true});writeFileSync('outputs/navigation-audit-progress.json',JSON.stringify({results:[...results.values()].map(({html,...r})=>r),pending:[...queue]}));
  console.log(JSON.stringify({checked:results.size,pending:queue.size,errors:[...results.values()].filter(r=>r.error).length}));
}
const brokenAnchors=anchors.filter(a=>{const u=new URL(a.url),hash=decodeURIComponent(u.hash.slice(1));u.hash='';const html=results.get(u.href)?.html;return html && !html.includes(`id="${hash}"`) && !html.includes(`name="${hash}"`);});
const externalResults=[];
for(let i=0;i<[...external].length;i+=6) await Promise.all([...external].slice(i,i+6).map(async url=>{const {html,...row}=await request(url,true);externalResults.push({url,...row});}));
const rows=[...results.values()].map(({html,...r})=>({...r,title:html?.match(/<title[^>]*>(.*?)<\/title>/s)?.[1]||'',linkedFrom:[...(refs.get(r.url)||[])]}));
const report={checkedAt:new Date().toISOString(),results:rows,brokenAnchors,externalResults};
mkdirSync('outputs',{recursive:true});writeFileSync('outputs/navigation-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({checked:rows.length,broken:rows.filter(r=>r.status>=400).length,unreachable:rows.filter(r=>r.error).length,brokenAnchors,external:externalResults.length}));
