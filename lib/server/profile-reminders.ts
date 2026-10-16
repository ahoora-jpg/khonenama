const hasPhoto = "EXISTS(SELECT 1 FROM business_media m WHERE m.business_id=b.id AND m.kind IN ('cover','image') AND COALESCE(m.media_type,'image')='image' AND length(trim(COALESCE(m.file_url,'')))>0)";
const eligible = "u.status='active' AND length(trim(COALESCE(u.email,'')))>3 AND bm.role='owner' AND bm.status='active' AND b.status IN ('draft','pending','published') AND b.slug<>'alayy-dkvr-krj' AND b.slug NOT GLOB 'ghrfh-azmayshy-tbdyl-[0-9]*-thran' AND julianday(b.created_at)<=julianday('now','-7 days') AND NOT EXISTS(SELECT 1 FROM business_visibility_controls v WHERE v.business_id=b.id AND v.owner_paused=1) AND NOT " + hasPhoto;
const ownerJoin = "FROM businesses b JOIN business_members bm ON bm.business_id=b.id JOIN users u ON u.id=bm.user_id";
const validEmail=(v:unknown)=>typeof v==='string'&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);
export async function ensureProfileReminders(db:any){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS business_visibility_controls(business_id INTEGER PRIMARY KEY,owner_paused INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  db.prepare("CREATE TABLE IF NOT EXISTS profile_photo_reminders(user_id TEXT PRIMARY KEY,business_id INTEGER NOT NULL,id TEXT NOT NULL UNIQUE DEFAULT(lower(hex(randomblob(16)))),state TEXT NOT NULL DEFAULT 'pending',attempts INTEGER NOT NULL DEFAULT 0,next_attempt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,first_attempt_at TEXT,lease_until TEXT,lease_token TEXT,payload_json TEXT,provider_id TEXT,error_code TEXT,sent_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  db.prepare("CREATE INDEX IF NOT EXISTS profile_reminders_due ON profile_photo_reminders(state,next_attempt)"),
 ]);
}
export async function queueProfileReminders(db:any){
 await ensureProfileReminders(db);
 return db.prepare("INSERT OR IGNORE INTO profile_photo_reminders(user_id,business_id) SELECT u.id,MIN(b.id) "+ownerJoin+" WHERE "+eligible+" AND NOT EXISTS(SELECT 1 FROM profile_photo_reminders r WHERE r.user_id=u.id) GROUP BY u.id ORDER BY MIN(b.created_at) LIMIT 50").run();
}
function escapeHtml(v:string){return v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
export function profileReminderMessage(from:string,email:string,name:string){
 const dashboard='https://khonenama.ir/dashboard#media',profile='https://khonenama.ir/dashboard/profile';
 const intro=`یک هفته از ثبت‌نام غرفه «${name}» در خونه‌نما گذشته و هنوز عکسی برای آن بارگذاری نشده است.`;
 const help='چند عکس از محصولات، فضای کار یا نمونه‌کارهایتان اضافه کنید و اطلاعات پروفایل را کامل کنید تا مشتریان راحت‌تر با کسب‌وکارتان آشنا شوند.';
 return {from,to:[email],reply_to:'info@khonenama.ir',subject:'عکس غرفه‌تان را در خونه‌نما تکمیل کنید',text:`سلام،\n${intro}\n${help}\n\nافزودن عکس: ${dashboard}\nتکمیل پروفایل: ${profile}\n\nاین یادآور فقط یک‌بار ارسال می‌شود. برای راهنمایی می‌توانید به همین ایمیل پاسخ دهید.`,html:`<!doctype html><html lang="fa" dir="rtl"><body style="direction:rtl;text-align:right;background:#faf7f2;color:#292820;padding:24px;line-height:1.9"><main style="max-width:560px;margin:auto;background:white;padding:24px;border-radius:16px"><h1 style="font-size:22px">غرفه‌تان را با چند عکس معرفی کنید</h1><p>سلام،</p><p>${escapeHtml(intro)}</p><p>${help}</p><p><a href="${dashboard}" style="display:inline-block;padding:10px 20px;background:#85502d;color:white;text-decoration:none;border-radius:10px">افزودن عکس به غرفه</a></p><p><a href="${profile}">تکمیل اطلاعات پروفایل</a></p><p style="font-size:14px">این یادآور فقط یک‌بار ارسال می‌شود. برای راهنمایی می‌توانید به همین ایمیل پاسخ دهید.</p></main></body></html>`};
}
export async function drainProfileReminders(db:any,settings:any,send:typeof fetch=fetch){
 if(!db||typeof settings?.RESEND_API_KEY!=='string'||settings.RESEND_API_KEY.length<10||!validEmail(settings.RECOVERY_EMAIL_FROM))return {configured:false,accepted:0};
 await queueProfileReminders(db);
 // Do not retry uncertain deliveries beyond the provider's 24-hour deduplication window.
 await db.prepare("UPDATE profile_photo_reminders SET state='failed',error_code='RETRY_WINDOW_EXPIRED' WHERE state IN ('pending','sending') AND first_attempt_at IS NOT NULL AND julianday(first_attempt_at)<=julianday('now','-20 hours')").run();
 const rows=(await db.prepare("SELECT user_id FROM profile_photo_reminders WHERE attempts<6 AND ((state='pending' AND next_attempt<=CURRENT_TIMESTAMP) OR (state='sending' AND lease_until<=CURRENT_TIMESTAMP)) ORDER BY created_at LIMIT 5").all()).results||[];
 let accepted=0;
 for(const candidate of rows){
  const lease=crypto.randomUUID();
  const row=await db.prepare("UPDATE profile_photo_reminders SET state='sending',lease_token=?,lease_until=datetime('now','+5 minutes'),attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,CURRENT_TIMESTAMP) WHERE user_id=? AND attempts<6 AND ((state='pending' AND next_attempt<=CURRENT_TIMESTAMP) OR (state='sending' AND lease_until<=CURRENT_TIMESTAMP)) RETURNING *").bind(lease,candidate.user_id).first();
  if(!row)continue;
  const finish=async(state:string,error:string|null,id:string|null=null)=>db.prepare("UPDATE profile_photo_reminders SET state=?,error_code=?,provider_id=?,sent_at=CASE WHEN ?='sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,lease_until=NULL,next_attempt=datetime('now',?) WHERE user_id=? AND lease_token=?").bind(state,error,id,state,`+${Math.min(3600,60*2**row.attempts)} seconds`,row.user_id,lease).run();
  try{
   const owner=await db.prepare("SELECT u.email,b.name "+ownerJoin+" WHERE u.id=? AND b.id=? AND "+eligible).bind(row.user_id,row.business_id).first();
   if(!owner||!validEmail(owner.email)){await finish('cancelled','NO_LONGER_ELIGIBLE');continue;}
   let payload=row.payload_json?JSON.parse(row.payload_json):profileReminderMessage(settings.RECOVERY_EMAIL_FROM,owner.email,owner.name);
   if(payload.to?.[0]!==owner.email){await finish('cancelled','EMAIL_CHANGED');continue;}
   if(!row.payload_json){const saved=await db.prepare("UPDATE profile_photo_reminders SET payload_json=? WHERE user_id=? AND lease_token=? RETURNING payload_json").bind(JSON.stringify(payload),row.user_id,lease).first();if(!saved)continue;payload=JSON.parse(saved.payload_json);}
   const response=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+settings.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'profile-photo-reminder-'+row.id},body:JSON.stringify(payload),signal:AbortSignal.timeout(8000),redirect:'manual'});
   const data=await response.json().catch(()=>null) as any;
   if(response.ok&&typeof data?.id==='string'){await finish('sent',null,data.id.slice(0,255));accepted++;continue;}
   const retry=response.status===429||response.status>=500||(response.status===409&&data?.name==='concurrent_idempotent_requests')||response.ok;
   await finish(retry&&row.attempts<6?'pending':'failed','PROVIDER_'+response.status);
  }catch{await finish(row.attempts<6?'pending':'failed','SEND_UNCERTAIN');}
 }
 return {configured:true,accepted};
}
