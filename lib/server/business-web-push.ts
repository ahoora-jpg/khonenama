import {buildPushPayload} from "@block65/webcrypto-web-push";
import {validPushEndpoint} from "@/lib/web-push-subscription";

export async function ensureWebPushSchema(db:any){
 await db.prepare("CREATE TABLE IF NOT EXISTS web_push_keys (id INTEGER PRIMARY KEY CHECK(id=1),public_key TEXT NOT NULL,private_key TEXT NOT NULL)").run();
 await db.prepare("CREATE TABLE IF NOT EXISTS business_web_push (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,user_id TEXT NOT NULL,endpoint TEXT NOT NULL UNIQUE,subscription TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
 await db.prepare("CREATE TABLE IF NOT EXISTS business_web_push_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,lead_id INTEGER NOT NULL,subscription_id INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(business_id,lead_id,subscription_id))").run();
 await db.prepare("CREATE INDEX IF NOT EXISTS idx_web_push_due ON business_web_push_outbox(state,next_attempt)").run();
}
export async function getWebPushKeys(db:any){
 await ensureWebPushSchema(db);
 let keys=await db.prepare("SELECT public_key,private_key FROM web_push_keys WHERE id=1").first();
 if(!keys){
  const pair=await crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"]);
  const jwk=await crypto.subtle.exportKey("jwk",pair.privateKey);
  const raw=new Uint8Array(await crypto.subtle.exportKey("raw",pair.publicKey));
  const publicKey=btoa(String.fromCharCode(...raw)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  await db.prepare("INSERT OR IGNORE INTO web_push_keys(id,public_key,private_key) VALUES(1,?,?)").bind(publicKey,jwk.d).run();
  keys=await db.prepare("SELECT public_key,private_key FROM web_push_keys WHERE id=1").first();
 }
 return keys;
}
export async function drainBusinessWebPush(db:any){
 await ensureWebPushSchema(db);
 await db.prepare("UPDATE business_web_push_outbox SET state='cancelled' WHERE state IN ('pending','sending') AND NOT EXISTS (SELECT 1 FROM business_web_push p JOIN business_members m ON m.business_id=p.business_id AND m.user_id=p.user_id AND m.status='active' WHERE p.id=business_web_push_outbox.subscription_id AND p.business_id=business_web_push_outbox.business_id AND p.active=1)").run();
 const rows=await db.prepare("SELECT o.*,p.endpoint,p.subscription FROM business_web_push_outbox o JOIN business_web_push p ON p.id=o.subscription_id WHERE o.state IN ('pending','sending') AND o.next_attempt<=CURRENT_TIMESTAMP ORDER BY o.id LIMIT 30").all();
 if(!rows.results?.length)return;
 const keys=await getWebPushKeys(db);
 await Promise.all(rows.results.map(async(row:any)=>{
  const claim=await db.prepare("UPDATE business_web_push_outbox SET state='sending',attempts=attempts+1,next_attempt=datetime('now','+2 minutes') WHERE id=? AND state IN ('pending','sending') AND next_attempt<=CURRENT_TIMESTAMP RETURNING attempts").bind(row.id).first();
  if(!claim)return;
  let status=0;
  try{
   if(!validPushEndpoint(row.endpoint))status=410;
   else{
    const payload=await buildPushPayload({data:JSON.stringify({title:"درخواست جدید خونه‌نما",body:"یک درخواست مشتری در صندوق غرفه شما ثبت شد.",url:"/dashboard#leads",tag:`request-${row.lead_id}`}),options:{ttl:3600}},JSON.parse(row.subscription),{subject:"https://khonenama.ir/support",publicKey:keys.public_key,privateKey:keys.private_key});
    const response=await fetch(row.endpoint,{...payload,redirect:"error",signal:AbortSignal.timeout(8000)});status=response.status;
   }
  }catch{/* Keep transient failures for the scheduled retry. */}
  if(status===404||status===410)await db.prepare("UPDATE business_web_push SET active=0 WHERE id=?").bind(row.subscription_id).run();
  const accepted=status>=200&&status<300;
  const retry=!accepted&&(status===0||status===429||status>=500)&&claim.attempts<8;
  await db.prepare("UPDATE business_web_push_outbox SET state=?,next_attempt=datetime('now',?) WHERE id=?").bind(accepted?"provider_accepted":retry?"pending":"failed",`+${Math.min(3600,60*2**(claim.attempts-1))} seconds`,row.id).run();
 }));
 await db.prepare("DELETE FROM business_web_push_outbox WHERE state IN ('provider_accepted','failed','cancelled') AND created_at<datetime('now','-30 days')").run();
}
export async function sendBusinessWebPush(db:any,businessId:number,leadId:number){
 try{
  await ensureWebPushSchema(db);
  await db.prepare("INSERT OR IGNORE INTO business_web_push_outbox(business_id,lead_id,subscription_id) SELECT p.business_id,?,p.id FROM business_web_push p JOIN business_members m ON m.business_id=p.business_id AND m.user_id=p.user_id AND m.status='active' WHERE p.business_id=? AND p.active=1").bind(leadId,businessId).run();
  await drainBusinessWebPush(db);
 }catch{console.warn("web push queue unavailable",{businessId,leadId});}
}
