import { env } from "cloudflare:workers";
import { recoveryConfigured, requestRecovery, requestRecoveryWithoutEmail, resetPassword } from "@/lib/server/password-recovery";
const headers = {"Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
export async function GET() { return Response.json({ok:true,available:recoveryConfigured(env)},{headers}); }
export async function POST(request: Request) {
  const body = await request.json().catch(()=>null);
  if (!body || typeof body !== "object") return Response.json({ok:false,error:"INVALID_REQUEST"},{status:400,headers});
  try {
    if (body.action === "reset") {
      if (typeof body.token !== "string" || typeof body.password !== "string") throw Error("INVALID_RESET");
      await resetPassword((env as any).DB,body.token,body.password);
    } else {
      const phone = typeof body.phone === "string" ? body.phone.replace(/[۰-۹]/g,(c: string)=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g,(c: string)=>String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/[\s-]/g,"") : "";
      if (body.action === "email_access_help") {
        if (!/^09\d{9}$/.test(phone)) throw Error("INVALID_REQUEST");
        await requestRecoveryWithoutEmail((env as any).DB,phone,request.headers.get("cf-connecting-ip")||"unknown");
        return Response.json({ok:true},{headers});
      }
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (email.length>160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^09\d{9}$/.test(phone)) throw Error("INVALID_REQUEST");
      await requestRecovery((env as any).DB,env,email,phone,request.headers.get("cf-connecting-ip")||"unknown");
    }
    return Response.json({ok:true},{headers});
  } catch(error) {
    const code = error instanceof Error ? error.message : "UNAVAILABLE";
    const allowed = ["EMAIL_NOT_CONFIGURED","EMAIL_SEND_FAILED","TOO_MANY_ATTEMPTS","INVALID_REQUEST","INVALID_RESET","RESET_EXPIRED"];
    return Response.json({ok:false,error:allowed.includes(code)?code:"UNAVAILABLE"},{status:code==="TOO_MANY_ATTEMPTS"?429:code.startsWith("EMAIL_")||!allowed.includes(code)?503:400,headers});
  }
}

