import { env } from 'cloudflare:workers';
import { billingCatalog,billingHeaders } from '@/lib/server/billing';
import { paymentProvider } from '@/lib/server/payment-provider';
export async function POST(request: Request) {
  const body=await request.json().catch(()=>({}));
  const plan=(await billingCatalog((env as any).DB,paymentProvider(env as any))).find(p=>p.code===body.planCode);
  if(!plan)return Response.json({ok:false,error:'PLAN_NOT_FOUND'},{status:404});
  if(plan.amountToman===null)return Response.json({ok:false,error:'PLAN_PRICING_NOT_ACTIVE'},{status:409});
  return Response.json({ok:true,plan:{code:plan.code,name:plan.name},durationDays:plan.durationDays,purchasable:plan.purchasable,currency:'IRT',amounts:{subtotal:plan.amountToman,discount:0,tax:0,total:plan.amountToman}},{headers:billingHeaders});
}
