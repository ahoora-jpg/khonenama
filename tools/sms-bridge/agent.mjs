import { readFile, writeFile, rename } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configPath = resolve(process.env.SMS_BRIDGE_CONFIG || "./sms-bridge.config.json");
const journalPath = resolve(process.env.SMS_BRIDGE_JOURNAL || "./sms-bridge.journal.json");
const delay = ms => new Promise(done=>setTimeout(done,ms));

export function validateConfig(c) {
  if (!c || ![2,"default"].includes(c.simNumber)) throw Error("Invalid bridge configuration");
  let site,phone;
  try{site=new URL(c.siteUrl);phone=new URL(c.phoneUrl);}catch{throw Error("Invalid bridge URL");}
  if(site.protocol!=="https:" || !["khonenama.ir","www.khonenama.ir"].includes(site.hostname) || site.username || site.password ||
    phone.protocol!=="http:" || !/^(?:localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/.test(phone.hostname) || phone.username || phone.password)
    throw Error("Bridge endpoints must be Khonenama HTTPS and a private phone address");
  if (!c.bridgeToken || !c.phoneUser || !c.phonePassword || !["/message","/messages"].includes(c.sendPath)) throw Error("Missing bridge configuration");
  if (!["/message/{id}","/messages/{id}"].includes(c.statusPath)) throw Error("Status endpoint must be confirmed on the installed device");
  return c;
}

async function loadJournal() { try { return JSON.parse(await readFile(journalPath,"utf8")); } catch(e) { if(e.code==="ENOENT") return {}; throw e; } }
async function saveJournal(journal) {
  await writeFile(journalPath+".tmp",JSON.stringify(journal),{mode:0o600});
  await rename(journalPath+".tmp",journalPath);
}

export function parseExpiry(value) {
  if(typeof value!=="string")return NaN;
  // D1 datetime() values are UTC even when SQLite omits the timezone suffix.
  return Date.parse(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d(?:\.\d+)?$/.test(value)?value.replace(" ","T")+"Z":value);
}
export function gatewayPayload(job) {
  if (![2,"default"].includes(job.simNumber)) throw Error("Approved SIM selection required");
  return { id: job.gatewayId, textMessage:{text:job.body}, phoneNumbers:[job.phone], ...(job.simNumber===2?{simNumber:2}:{}), withDeliveryReport:true,
    ttl:Math.max(5,Math.floor((parseExpiry(job.expiresAt)-Date.now())/1000)) };
}

export async function bridgeRequest(config,action,fields={}) {
  const attempts=["heartbeat","authorize","inboxSenders"].includes(action)?3:1;
  let response;
  for(let attempt=0;attempt<attempts;attempt++){
    try{response=await fetch(new URL("/api/v1/sms/bridge",config.siteUrl),{method:"POST",headers:{"Authorization":"Bearer "+config.bridgeToken,"Content-Type":"application/json"},body:JSON.stringify({action,simNumber:config.simNumber,...fields}),signal:AbortSignal.timeout(15000)});break;}
    catch(error){if(attempt===attempts-1 || !["TimeoutError","AbortError","TypeError"].includes(error.name))throw error;await delay(500);}
  }
  const data=await response.json();
  if(!response.ok) throw Error("Bridge API rejected request: "+response.status+" "+(data.error||""));
  return data;
}

export async function gatewayRequest(config,path,method,body) {
  const response=await fetch(new URL(path,config.phoneUrl),{method,headers:{"Authorization":"Basic "+Buffer.from(config.phoneUser+":"+config.phonePassword).toString("base64"),"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  const data=await response.json().catch(()=>({}));
  return {status:response.status,ok:response.ok,data};
}

export async function reconcileJob(config,job) {
  let result;
  try { result=await gatewayRequest(config,config.statusPath.replace("{id}",encodeURIComponent(job.gatewayId)),"GET"); }
  catch { return {uncertain:true}; }
  if(!result.ok || !["Pending","Processed","Sent","Delivered","Failed","Cancelled"].includes(result.data.state)) return {uncertain:true};
  return {gatewayState:result.data.state};
}

export async function syncInbox(config,seen,allowed) {
  const result=await gatewayRequest(config,"/inbox?type=SMS&limit=500","GET");
  if(!result.ok || !Array.isArray(result.data)) throw Error("Phone inbox unavailable");
  if(result.data.length===500) throw Error("Phone inbox page is full; reconciliation required before promotions");
  for(const item of result.data) {
    const id=String(item.id||"");
    if(!id || seen[id] || !allowed.has(String(item.sender||""))) continue;
    const body=String(item.contentPreview||item.content||"");
    if(!body || !item.sender || !item.createdAt) continue;
    await bridgeRequest(config,"inbound",{id,sender:item.sender,body,receivedAt:item.createdAt});
    seen[id]=Date.now();
  }
  for(const [id,time] of Object.entries(seen)) if(time<Date.now()-7*86400_000) delete seen[id];
  return seen;
}

export async function processJob(config,job,journal) {
  if (![2,"default"].includes(job.simNumber) || job.simNumber!==config.simNumber || !/^\+\d{8,15}$/.test(job.phone) || !Number.isFinite(parseExpiry(job.expiresAt)) || parseExpiry(job.expiresAt)<=Date.now()) {
    journal[job.id]={job,phase:"report_pending",report:{uncertain:true}}; await saveJournal(journal); return;
  }
  const permission=await bridgeRequest(config,"authorize",{messageId:job.id,leaseToken:job.leaseToken});
  if(!permission.allowed){
    await bridgeRequest(config,"report",{messageId:job.id,leaseToken:job.leaseToken,gatewayMessageId:job.gatewayId,gatewayState:"Cancelled"});
    return;
  }
  // Write ahead: a crash after this point can never cause automatic re-submission.
  journal[job.id]={job,phase:"submission_started"}; await saveJournal(journal);
  let report;
  try {
    const response=await gatewayRequest(config,config.sendPath,"POST",gatewayPayload(job));
    if(response.ok && typeof response.data.id==="string" && /^[a-zA-Z0-9_-]{1,120}$/.test(response.data.id)){
      job.gatewayId=response.data.id;
      journal[job.id]={job,phase:"submission_started"};await saveJournal(journal);
    }
    report=response.ok ? await reconcileJob(config,job) : {uncertain:true};
  } catch { report=await reconcileJob(config,job); }
  journal[job.id]={job,phase:"report_pending",report}; await saveJournal(journal);
  await bridgeRequest(config,"report",{messageId:job.id,leaseToken:job.leaseToken,gatewayMessageId:job.gatewayId,...report});
  delete journal[job.id]; await saveJournal(journal);
}

export async function main() {
  const config=validateConfig(JSON.parse(await readFile(configPath,"utf8")));
  if (process.env.SMS_ENABLE_SEND!=="YES") throw Error("Bridge is disarmed. SMS_ENABLE_SEND=YES is required after authorization.");
  const journal=await loadJournal();
  const seen={};
  let lastInboxPoll=0;
  while(true) {
    let phase="site-heartbeat";
    try {
      await bridgeRequest(config,"heartbeat");
      phase="journal-reconciliation";
      for (const entry of Object.values(journal)) {
        const report=entry.phase==="report_pending"?entry.report:await reconcileJob(config,entry.job);
        await bridgeRequest(config,"report",{messageId:entry.job.id,leaseToken:entry.job.leaseToken,gatewayMessageId:entry.job.gatewayId,...report});
        delete journal[entry.job.id]; await saveJournal(journal);
      }
      phase="phone-health";
      const health=await gatewayRequest(config,"/health","GET");
      if(!health.ok) throw Error("Phone gateway is offline");
      phase="queue-claim";
      const {job}=await bridgeRequest(config,"claim");
      phase="message-processing";
      if(job) await processJob(config,job,journal);
      phase="delivery-reconciliation";
      const reconciliation=await bridgeRequest(config,"reconcile");
      if(reconciliation.job){
        const pending=reconciliation.job;
        const report=await reconcileJob(config,pending);
        if(!report.uncertain) await bridgeRequest(config,"report",{messageId:pending.id,leaseToken:pending.leaseToken,gatewayMessageId:pending.gatewayId,...report});
      }
      if(config.enableInbox===true&&Date.now()-lastInboxPoll>60_000){
        phase="inbox-sync";
        const {phones}=await bridgeRequest(config,"inboxSenders");
        await syncInbox(config,seen,new Set(phones));
        await bridgeRequest(config,"inboxHealthy");lastInboxPoll=Date.now();
      }
    } catch(e) { console.error("Bridge cycle failed at",phase+":",e.message); }
    await delay(15000);
  }
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(e=>{console.error(e.message);process.exitCode=1;});
