import {writeFileSync} from 'node:fs';
const checks=[];
const queries=['پرده','موکت','پارکت','کاغذ دیواری','طراحی داخلی','خانه هوشمند','پرده زبرا','پارکت چوبی','كاغذ ديواري','عبارتناموجودآزمایشی'];
for(const q of queries){const url=new URL('https://khonenama.ir/search');url.searchParams.set('q',q);const response=await fetch(url,{signal:AbortSignal.timeout(30000)});const html=await response.text();const slugs=[...html.matchAll(/class="result-card[^\"]*" href="([^\"]+)"/g)].map(match=>match[1]);checks.push({query:q,status:response.status,heading:html.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1]?.replace(/<[^>]*>/g,''),results:slugs,empty:html.includes('نتیجه‌ای پیدا نشد.')});console.log(JSON.stringify(checks.at(-1)));}
writeFileSync('outputs/live-search-audit.json',JSON.stringify(checks,null,2));
