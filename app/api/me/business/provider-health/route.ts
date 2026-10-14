import { env } from "cloudflare:workers";
import { getOwnedBusiness } from "@/lib/server/business-media";
import { getImageKitConfig } from "@/lib/server/imagekit";

// Authenticated, read-only checks. Never return vendor files, domains or credentials.
export async function GET(request: Request) {
  if (!await getOwnedBusiness(request)) return Response.json({ok:false},{status:401});
  async function probe(url: string, authorization: string) {
    try {
      const response=await fetch(url,{headers:{Authorization:authorization},signal:AbortSignal.timeout(8000),redirect:"manual"});
      const data=await response.json().catch(()=>null) as {name?:unknown} | null;
      return {status:response.status,code:typeof data?.name==="string"&&/^[a-z_]{1,40}$/.test(data.name)?data.name:null};
    } catch(error) {
      const detail=error&&typeof error==="object"?error as {message?:unknown;name?:unknown}:null;
      const message=typeof detail?.message==="string"?detail.message.toLowerCase():"";
      return {status:0,code:message.includes("header")?"invalid_header":message.includes("fetch")?"network_fetch":message.includes("abort")||message.includes("timeout")?"timeout":"runtime_error",type:typeof detail?.name==="string"&&/^[A-Za-z]{1,40}$/.test(detail.name)?detail.name:null};
    }
  }
  const imagekit=getImageKitConfig();
  const resend=String((env as any).RESEND_API_KEY||"").trim();
  const [images,email]=await Promise.all([
    probe("https://api.imagekit.io/v1/files?limit=1","Basic "+btoa(imagekit.privateKey+":")),
    probe("https://api.resend.com/domains","Bearer "+resend),
  ]);
  return Response.json({ok:true,imagekit:images,resend:email},{headers:{"Cache-Control":"private, no-store"}});
}
