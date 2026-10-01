import {env} from "cloudflare:workers";
import {isAdminRequest} from "@/lib/server/admin-session";
export async function GET(request:Request){
  if(!(await isAdminRequest(request)))return Response.json({ok:false},{status:401});
  const db=(env as any).DB;
  const rows=await db.prepare("SELECT p.id,p.status,p.amount,p.currency,p.provider,p.provider_reference,p.requested_at,p.verified_at,i.invoice_number,b.name AS business_name,b.id AS business_id FROM payments p JOIN invoices i ON i.id=p.invoice_id LEFT JOIN businesses b ON b.id=i.business_id ORDER BY p.id DESC LIMIT 100").all();
  return Response.json({ok:true,payments:rows.results||[]},{headers:{'Cache-Control':'private, no-store'}});
}
