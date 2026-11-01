import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

// Run with SMS_QA_PLAYWRIGHT pointing to a local Playwright package if not installed here.
const require=createRequire(import.meta.url);
const {chromium}=process.env.SMS_QA_PLAYWRIGHT?require(resolve(process.env.SMS_QA_PLAYWRIGHT)):require('playwright');
const out=resolve(process.env.SMS_QA_OUTPUT || '../sms-command-visual-qa');await mkdir(out,{recursive:true});
const server=await createServer({configFile:false,root:resolve('tools/sms-ui-fixture'),publicDir:resolve('public'),plugins:[react()],resolve:{alias:{'@':resolve('.'),'next/link':resolve('tools/sms-ui-fixture/next-link.tsx'),'next/navigation':resolve('tools/sms-ui-fixture/next-navigation.ts')}},server:{host:'127.0.0.1',port:5199,strictPort:true,fs:{allow:[resolve('.'),resolve('../home-booth-priority/node_modules')]}}});
await server.listen();console.log("QA local server ready");
const browser=await chromium.launch({headless:true,...(process.env.SMS_QA_BROWSER?{executablePath:process.env.SMS_QA_BROWSER}:{})});
console.log("QA browser ready");const results=[];
try {
 const page=await browser.newPage();page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let paused=false,retries=0;
 const now=new Date().toISOString();
 const campaign={id:'mock-campaign',name:'کمپین آزمایشی محلی',status:'running',scheduled_at:now,max_recipients:3,audience:3,total:3,queued:2,delivered:0,failed:1,sending:0,group_id:'mock-group',group_count:3,eligible_count:3,queued_count:3,total_messages:3,failed_count:1};
 const contact={id:'mock-contact',display_name:'مخاطب آزمایشی',phone_e164:'09*****0000',kind:'other',consent_status:'active'};
 const message={id:'mock-failed',phone_e164:contact.phone_e164,status:'failed',body:'پیام آزمایشی محلی؛ دادهٔ واقعی نیست.',category:'promotional',created_at:now};
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),body=req.method()==='POST'?req.postDataJSON():{};let data;
  if(url.pathname.endsWith('/session'))data={authenticated:true};
  else if(url.pathname.endsWith('/control')){
   if(body.action==='pauseAll')paused=true;if(body.action==='resumeAll')paused=false;
   data=body.action==='previewRetry'?{ids:['mock-failed'],requestedIds:['mock-failed'],eligible:1,skipped:0,token:'mock-preview'}:body.action==='retry'?{created:++retries===1?1:0}: {control:{paused:Number(paused),revision:1}};
  }else if(url.pathname.endsWith('/campaigns') && req.method()==='POST') {
   if(body.action==='create')data={id:'mock-new'};
   else if(body.action==='startPreview')data={name:campaign.name,eligible:3,parts:3,cost:null,scheduledAt:null};
   else{if(body.action==='pause')campaign.status='paused';if(body.action==='resume'||body.action==='approve')campaign.status='running';if(body.action==='cancel')campaign.status='cancelled';data={};}
  }else if(url.pathname.endsWith('/templates'))data={templates:[]};
  else if(url.pathname.endsWith('/campaigns'))data={groups:[{id:'mock-group',name:'گروه آزمایشی'}],campaigns:[campaign],liveSendingEnabled:true};
  else if(url.pathname.endsWith('/workspace'))data=url.searchParams.get('view')==='groups'?{groups:[{id:'mock-group',name:'گروه آزمایشی',member_count:3,eligible_count:3}],members:[],total:0,page:1,size:20}:{items:url.searchParams.get('view')==='contacts'?[contact]:[message],total:1,page:1,size:20};
  else if(url.pathname.endsWith('/acquisition'))data={summary:{recipients:0,clicks:null,booths:null},rows:[],daily:[],campaigns:[],compare:[],settings:{tracking_enabled:1}};
  else data={counts:[{status:'queued',count:2},{status:'failed',count:1}],contacts:[contact],messages:[message],campaigns:[campaign],agent:{enabled:1,gateway_enabled:1,inbound_enabled:1,last_seen_at:now,last_inbox_at:now,sim_selection:'default',sim_number:2},summary:{contact_count:3,active_campaigns:1,consented_contacts:3},control:{paused:Number(paused),revision:1},liveSendingEnabled:true,setup:{}};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,...data})});
 });
 // No outgoing request may reach a real SMS gateway or production endpoint.
 await page.route('https://**/*',route=>route.abort());
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:1000});
  for(const [screen,tab] of [['dashboard',''],['campaigns',''],['messages','failed'],['contacts','all'],['gateway','']]){
   console.log("QA screen",screen,width);await page.goto(`http://127.0.0.1:5199/?screen=${screen}&tab=${tab}`,{waitUntil:"domcontentloaded"});await page.getByText('در حال بارگذاری').count();await page.locator('.sms-skeleton').count();
   await page.locator('.sms-content .sms-panel, .sms-command-banner').first().waitFor();await page.waitForTimeout(200);
   const dimensions=await page.evaluate(()=>({viewport:innerWidth,body:document.documentElement.scrollWidth}));assert.ok(dimensions.body<=width+1,`${screen} overflow at ${width}: ${dimensions.body}`);
   await page.screenshot({path:resolve(out,`${screen}-${width}.png`),fullPage:true});results.push({screen,width,...dimensions});
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:5199/?screen=dashboard');page.on('dialog',d=>d.accept());
 await page.getByRole('button',{name:'توقف همه ارسال‌ها',exact:true}).click();await page.getByRole('button',{name:'ادامه همه ارسال‌ها',exact:true}).waitFor();assert.equal(paused,true);
 await page.getByRole('button',{name:'ادامه همه ارسال‌ها',exact:true}).click();await page.getByRole('button',{name:'توقف همه ارسال‌ها',exact:true}).waitFor();assert.equal(paused,false);
 await page.goto('http://127.0.0.1:5199/?screen=messages&tab=failed');await page.getByRole('button',{name:'تلاش مجدد',exact:true}).click();await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'تأیید و ثبت تلاش مجدد',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(retries,1);
 await page.goto('http://127.0.0.1:5199/?screen=campaigns&new=1');await page.getByRole('dialog').waitFor();assert.equal(await page.locator('.sms-steps li').count(),3);
 await page.getByLabel('نام و هدف کمپین').fill('آزمون سه مرحله');await page.getByLabel(/گروه مخاطبان/).selectOption('mock-group');await page.getByRole('button',{name:'ادامه',exact:true}).click();
 await page.getByLabel('متن کمپین',{exact:true}).fill('سلام {{name}}');await page.getByRole('button',{name:'ادامه',exact:true}).click();await page.getByRole('button',{name:'بازبینی نهایی و شروع',exact:true}).click();
 await page.getByRole('button',{name:'بازبینی شروع کمپین',exact:true}).click();await page.getByRole('button',{name:'تأیید و شروع کمپین',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'توقف',exact:true}).click();await page.getByRole('button',{name:'ادامه',exact:true}).waitFor();assert.equal(campaign.status,'paused');
 await page.getByRole('button',{name:'ادامه',exact:true}).click();await page.getByRole('button',{name:'بازبینی شروع کمپین',exact:true}).click();await page.getByRole('button',{name:'تأیید و شروع کمپین',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(campaign.status,'running');
 await page.getByRole('button',{name:'لغو',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'تأیید',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(campaign.status,'cancelled');
 await page.goto('http://127.0.0.1:5199/?screen=contacts');await page.locator('.sms-workspace-tabs').getByRole('link',{name:'گروه‌ها',exact:true}).click();await page.locator('.sms-workspace-tabs a.is-active').filter({hasText:'گروه‌ها'}).waitFor();
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'results.json'),JSON.stringify({results,flows:['global pause/resume persisted mock','failed retry confirmation','three-step campaign start confirmation','campaign pause/resume/cancel','contact group tab navigation'],pageErrors:errors},null,2));console.log(JSON.stringify({screenshots:results.length,flows:5,pageErrors:errors.length,output:out}));
}catch(error){const failedPage=browser.contexts()[0]?.pages()[0];if(failedPage)await failedPage.screenshot({path:resolve(out,'failed-flow.png'),fullPage:true}).catch(()=>{});throw error;}finally{await browser.close();await server.close();}
