export async function ensurePushSchema(db: any) {
 await db.prepare("CREATE TABLE IF NOT EXISTS business_push_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,user_id TEXT NOT NULL,expo_push_token TEXT NOT NULL UNIQUE,platform TEXT NOT NULL DEFAULT 'android',active INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
 await db.prepare("CREATE INDEX IF NOT EXISTS idx_business_push_active ON business_push_tokens(business_id, active)").run();
 await db.prepare("CREATE TABLE IF NOT EXISTS business_push_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER NOT NULL,lead_id INTEGER NOT NULL,token_id INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,ticket_id TEXT,error_code TEXT,next_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(business_id,lead_id,token_id))").run();
 await db.prepare("CREATE INDEX IF NOT EXISTS idx_push_outbox_due ON business_push_outbox(state,next_attempt)").run();
}
type PushResult={status:string;id?:string;details?:{error?:string}};
async function provider(path:string,body:unknown){
 const response=await fetch(`https://exp.host/--/api/v2/push/${path}`,{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
 if(!response.ok)throw new Error(`HTTP_${response.status}`);
 return response.json() as Promise<{data:any}>;
}
async function retryOrFail(db:any,row:any,code:string){
 const temporary=/^(HTTP_(429|5\d\d)|NETWORK|MessageRateExceeded|RECEIPT_PENDING|INVALID_RESPONSE)$/.test(code);
 if(code==="DeviceNotRegistered")await db.prepare("UPDATE business_push_tokens SET active=0 WHERE id=?").bind(row.token_id).run();
 const again=temporary && Number(row.attempts)<8;
 const delay=Math.min(3600,60*Math.pow(2,Math.max(0,Number(row.attempts)-1)));
 await db.prepare("UPDATE business_push_outbox SET state=?,error_code=?,ticket_id=NULL,next_attempt=datetime('now',?),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(again?"pending":"failed",code,`+${delay} seconds`,row.id).run();
}
export async function drainBusinessPush(db:any){
 await ensurePushSchema(db);
 // Cancel delivery after logout, token transfer, or membership removal.
 await db.prepare("UPDATE business_push_outbox SET state='cancelled',updated_at=CURRENT_TIMESTAMP WHERE state IN ('pending','sending','ticketed') AND NOT EXISTS (SELECT 1 FROM business_push_tokens p JOIN business_members bm ON bm.business_id=p.business_id AND bm.user_id=p.user_id AND bm.status='active' WHERE p.id=business_push_outbox.token_id AND p.business_id=business_push_outbox.business_id AND p.active=1)").run();
 const due=await db.prepare("SELECT o.*,p.expo_push_token FROM business_push_outbox o JOIN business_push_tokens p ON p.id=o.token_id WHERE o.state IN ('pending','sending') AND o.next_attempt<=CURRENT_TIMESTAMP ORDER BY o.id LIMIT 100").all();
 const claimed:any[]=[];
 for(const row of due.results||[]){
  const claim=await db.prepare("UPDATE business_push_outbox SET state='sending',attempts=attempts+1,next_attempt=datetime('now','+2 minutes'),updated_at=CURRENT_TIMESTAMP WHERE id=? AND state IN ('pending','sending') AND next_attempt<=CURRENT_TIMESTAMP RETURNING attempts").bind(row.id).first();
  if(claim)claimed.push({...row,attempts:claim.attempts});
 }
 if(claimed.length){
  try{
   const payload=await provider("send",claimed.map(row=>({to:row.expo_push_token,sound:"default",title:"درخواست جدید خونه‌نما",body:`درخواست شماره ${row.lead_id} در صندوق دریافتی شما ثبت شد.`,data:{url:`/owner/request/${row.lead_id}`,leadId:row.lead_id},channelId:"business-requests",priority:"high"})));
   if(!Array.isArray(payload.data)||payload.data.length!==claimed.length)throw new Error("INVALID_RESPONSE");
   for(let index=0;index<claimed.length;index++){
    const result=payload.data[index] as PushResult,row=claimed[index];
    if(result.status==="ok"&&result.id)await db.prepare("UPDATE business_push_outbox SET state='ticketed',ticket_id=?,error_code=NULL,next_attempt=datetime('now','+15 minutes'),updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(result.id,row.id).run();
    else await retryOrFail(db,row,result.details?.error||"INVALID_RESPONSE");
   }
  }catch(error){const code=error instanceof Error&&/^(HTTP_\d+|INVALID_RESPONSE)$/.test(error.message)?error.message:"NETWORK";for(const row of claimed)await retryOrFail(db,row,code);}
 }
 const receipts=await db.prepare("SELECT * FROM business_push_outbox WHERE state='ticketed' AND next_attempt<=CURRENT_TIMESTAMP ORDER BY id LIMIT 100").all();
 if(receipts.results?.length){
  try{
   const payload=await provider("getReceipts",{ids:receipts.results.map((row:any)=>row.ticket_id)});
   for(const row of receipts.results){const receipt=payload.data?.[row.ticket_id] as PushResult|undefined;
    if(receipt?.status==="ok")await db.prepare("UPDATE business_push_outbox SET state='provider_accepted',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(row.id).run();
    else if(receipt)await retryOrFail(db,row,receipt.details?.error||"INVALID_RESPONSE");
    else await db.prepare("UPDATE business_push_outbox SET next_attempt=datetime('now','+15 minutes'),error_code='RECEIPT_PENDING' WHERE id=?").bind(row.id).run();
   }
  }catch{console.warn("business push receipt lookup unavailable");}
 }
 // Expired receipts cannot prove handset delivery. Preserve a clear failure status.
 await db.prepare("UPDATE business_push_outbox SET state='failed',error_code='RECEIPT_EXPIRED' WHERE state='ticketed' AND updated_at<datetime('now','-23 hours')").run();
 await db.prepare("DELETE FROM business_push_outbox WHERE state IN ('provider_accepted','failed','cancelled') AND updated_at<datetime('now','-30 days')").run();
}
export async function sendBusinessLeadPush(db:any,businessId:number,leadId:number){
 try{
  await ensurePushSchema(db);
  await db.prepare("INSERT OR IGNORE INTO business_push_outbox (business_id,lead_id,token_id) SELECT p.business_id,?,p.id FROM business_push_tokens p JOIN business_members bm ON bm.business_id=p.business_id AND bm.user_id=p.user_id AND bm.status='active' WHERE p.business_id=? AND p.active=1").bind(leadId,businessId).run();
  await drainBusinessPush(db);
 }catch{console.warn("business push queue unavailable",{businessId,leadId});}
}
