import { verifyLeadAccessCode } from '@/lib/server/lead-access';
import { ensureQuoteDetails } from '@/lib/server/quote-details';
import { env } from 'cloudflare:workers';
export async function POST(request: Request) {
  const headers = {'Cache-Control':'private, no-store'};
  const b = await request.json().catch(()=>null);
  const digits = (s: string)=>s.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
  const phone = typeof b?.customerPhone === 'string' ? digits(b.customerPhone).replace(/\D/g,'') : '';
  if (typeof b?.requestCode !== 'string' || !/^09\d{9}$/.test(phone) || typeof b?.businessSlug !== 'string' || !['accept','reject'].includes(b?.action)) return Response.json({ok:false},{status:400,headers});
  const db = (env as any).DB;
  if (!db) return Response.json({ok:false},{status:503,headers});
  const leadId = await verifyLeadAccessCode(db,digits(b.requestCode));
  if (!leadId) return Response.json({ok:false},{status:404,headers});
  await ensureQuoteDetails(db);
  const row = await db.prepare("SELECT q.id,q.status,l.status AS lead_status,d.revision,p.status AS participation_status FROM lead_quotes q JOIN leads l ON l.id=q.lead_id JOIN businesses bs ON bs.id=q.business_id LEFT JOIN lead_quote_details d ON d.quote_id=q.id LEFT JOIN lead_recipient_progress p ON p.lead_id=q.lead_id AND p.business_id=q.business_id WHERE l.id=? AND l.customer_phone=? AND bs.slug=?").bind(leadId,phone,b.businessSlug).first();
  if (!row || !['sent','accepted','rejected'].includes(row.status) || ['closed','cancelled'].includes(row.lead_status) || ['closed','cancelled'].includes(row.participation_status) || (row.revision && b.expectedRevision !== row.revision)) return Response.json({ok:false,error:'STALE_QUOTE'},{status:409,headers});
  const guard = "id=? AND EXISTS(SELECT 1 FROM leads l WHERE l.id=lead_quotes.lead_id AND l.customer_phone=? AND l.status NOT IN ('closed','cancelled')) AND NOT EXISTS(SELECT 1 FROM lead_recipient_progress p WHERE p.lead_id=lead_quotes.lead_id AND p.business_id=lead_quotes.business_id AND p.status IN ('closed','cancelled')) AND NOT EXISTS(SELECT 1 FROM lead_quote_details d WHERE d.quote_id=lead_quotes.id AND d.revision<>?)";
  const statements = [db.prepare("UPDATE lead_quotes SET status=?,updated_at=CURRENT_TIMESTAMP WHERE " + guard).bind(b.action==='accept'?'accepted':'rejected',row.id,phone,row.revision || '')];
  if (b.action === 'accept') statements.push(db.prepare("UPDATE lead_quote_details SET agreed_json=(SELECT json_object('amount',q.amount,'message',q.message,'terms',json(lead_quote_details.details_json)) FROM lead_quotes q WHERE q.id=quote_id),updated_at=CURRENT_TIMESTAMP WHERE quote_id=? AND revision=? AND EXISTS(SELECT 1 FROM lead_quotes q WHERE q.id=quote_id AND q.status='accepted')").bind(row.id,row.revision || ''));
  if (b.action==='reject' && row.status==='accepted') statements.push(db.prepare("UPDATE lead_quote_details SET agreed_json=NULL,updated_at=CURRENT_TIMESTAMP WHERE quote_id=? AND revision=? AND EXISTS(SELECT 1 FROM lead_quotes WHERE id=quote_id AND status='rejected')").bind(row.id,row.revision || ''));
  statements.push(db.prepare("INSERT OR IGNORE INTO lead_quote_events(quote_id,revision,event,payload_json) SELECT id,?,?,json_object('amount',amount,'message',message,'terms',json((SELECT details_json FROM lead_quote_details WHERE quote_id=lead_quotes.id))) FROM lead_quotes WHERE " + guard + " AND status=?").bind(row.revision || 'legacy',b.action,row.id,phone,row.revision || '',b.action==='accept'?'accepted':'rejected'));
  const result = await db.batch(statements);
  return Response.json({ok:Boolean(result[0]?.meta?.changes)},{status:result[0]?.meta?.changes?200:409,headers});
}
