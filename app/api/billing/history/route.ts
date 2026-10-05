import { getOwnedBusiness } from "@/lib/server/business-media";
import { billingHistory, billingHeaders } from "@/lib/server/billing";
export async function GET(request: Request) {
  const owner = await getOwnedBusiness(request);
  if (!owner) return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  return Response.json({ ok: true, invoices: await billingHistory(owner.db, Number(owner.business.id)) }, { headers: billingHeaders });
}
