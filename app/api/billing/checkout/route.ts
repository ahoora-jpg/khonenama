import { env } from 'cloudflare:workers';
import { getOwnedBusiness } from '@/lib/server/business-media';
import { BillingError, billingHeaders, createCheckout } from '@/lib/server/billing';
import { paymentProvider } from '@/lib/server/payment-provider';
export async function POST(request: Request) {
  const owner = await getOwnedBusiness(request);
  if (!owner) return Response.json({ok:false,error:'UNAUTHORIZED'},{status:401});
  const body = await request.json().catch(() => ({}));
  try {
    return Response.json({ok:true,...await createCheckout(owner,body,paymentProvider(env as any))},{status:201,headers:billingHeaders});
  } catch(error) {
    return Response.json({ok:false,error:error instanceof BillingError ? error.code : 'CHECKOUT_RETRY_REQUIRED'},{status:error instanceof BillingError ? error.status : 409,headers:billingHeaders});
  }
}
