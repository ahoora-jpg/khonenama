import {env} from "cloudflare:workers";
import {isAdminRequest} from "@/lib/server/admin-session";

const COOKIE="khonenama_sms_admin";
const HOURS=4;
async function sign(secret:string,value:string){
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(value)));
  return Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
}
function equal(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function cookie(request:Request){return (request.headers.get("cookie")||"").split(";").map(v=>v.trim()).find(v=>v.startsWith(COOKIE+"="))?.slice(COOKIE.length+1)||"";}

export function smsKeyConfigured(){return Boolean((env as any).SMS_ADMIN_ACCESS_KEY);}
export function clearSmsCookie(){return `${COOKIE}=; Path=/api/admin/sms; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;}

export async function verifySmsKey(value:string){
  const secret=String((env as any).SMS_ADMIN_ACCESS_KEY||"");
  if(!secret || !value)return false;
  const [candidate,expected]=await Promise.all([sign(secret,"key:"+value),sign(secret,"key:"+secret)]);
  return equal(candidate,expected);
}
export async function createSmsCookie(){
  const secret=String((env as any).SMS_ADMIN_ACCESS_KEY||"");
  if(!secret)throw Error("SMS_ADMIN_NOT_CONFIGURED");
  const expiry=Date.now()+HOURS*3600_000;
  const signature=await sign(secret,String(expiry));
  return `${COOKIE}=${expiry}.${signature}; Path=/api/admin/sms; HttpOnly; Secure; SameSite=Strict; Max-Age=${HOURS*3600}`;
}
export async function isSmsAdminRequest(request:Request){
  const internal=String((env as any).SMS_INTERNAL_TOKEN||'');
  if((env as any).SMS_ROLE==='panel'&&internal&&equal(request.headers.get('x-sms-internal-admin')||'',internal))return true;
  if(!await isAdminRequest(request))return false;
  const secret=String((env as any).SMS_ADMIN_ACCESS_KEY||"");
  if(!secret)return true; // The existing site administrator is the initial single-operator role.
  const [expiryString,signature]=cookie(request).split(".");
  const expiry=Number(expiryString);
  if(!signature || !Number.isSafeInteger(expiry) || expiry<=Date.now())return false;
  return equal(signature,await sign(secret,expiryString));
}
