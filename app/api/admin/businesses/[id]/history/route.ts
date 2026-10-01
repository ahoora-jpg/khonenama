import {env} from 'cloudflare:workers';
import {isAdminRequest} from '@/lib/server/admin-session';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!(await isAdminRequest(request)))return Response.json({ok:false},{status:401});
  const id=Number((await params).id);if(!Number.isSafeInteger(id)||id<1)return Response.json({ok:false},{status:400});
  const db=(env as any).DB;
  await db.prepare("CREATE TABLE IF NOT EXISTS business_admin_actions (id INTEGER PRIMARY KEY AUTOINCREMENT,business_id INTEGER,business_name TEXT,business_slug TEXT,action TEXT NOT NULL,previous_status TEXT,reason TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  const rows=await db.prepare("SELECT action,reason,created_at FROM business_admin_actions WHERE business_id=? ORDER BY id DESC LIMIT 50").bind(id).all();
  const hasOfferTable=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='launch_offer_grants'").first();
  const offer=hasOfferTable?await db.prepare("SELECT benefit_days,created_at FROM launch_offer_grants WHERE business_id=?").bind(id).first():null;
  return Response.json({ok:true,actions:rows.results||[],offer},{headers:{'Cache-Control':'private, no-store'}});
}
