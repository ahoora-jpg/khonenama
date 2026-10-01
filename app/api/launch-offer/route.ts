import {env} from 'cloudflare:workers';
import {ensureLaunchOffer} from '@/lib/server/launch-offer';
export async function GET(){
  const db=(env as any).DB;await ensureLaunchOffer(db);
  const offer=await db.prepare("SELECT benefit_days,datetime(starts_at,'+'||enrollment_days||' days') AS enrollment_ends_at FROM launch_offer_settings WHERE id=1 AND enabled=1 AND julianday('now')>=julianday(starts_at) AND julianday('now')<julianday(starts_at,'+'||enrollment_days||' days')").first();
  return Response.json({offer:offer||null},{headers:{'Cache-Control':'no-store'}});
}
