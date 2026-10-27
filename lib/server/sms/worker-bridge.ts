import { authenticateAgent, handleBridge } from "./bridge";
import { ensureSmsSchema } from "./schema";
import { crossSiteMutation, securityHeaders } from "../../request-security";

/** Dispatch the machine API before the HTML router, preserving its security boundary. */
export async function handleWorkerBridge(request: Request, db: any): Promise<Response> {
  const protect = (response: Response) => {
    for (const [key,value] of Object.entries(securityHeaders)) response.headers.set(key,value);
    response.headers.set("Cache-Control","private, no-store");
    return response;
  };
  const fail = (status:number,error:string) => protect(Response.json({ok:false,error},{status}));
  const url=new URL(request.url);
  if(url.protocol!=="https:") {url.protocol="https:";url.port="";return protect(new Response(null,{status:308,headers:{Location:url.href}}));}
  if(request.method!=="POST")return protect(Response.json({ok:false,error:"METHOD_NOT_ALLOWED"},{status:405,headers:{Allow:"POST"}}));
  if(crossSiteMutation(request))return fail(403,"FORBIDDEN");
  if(!await authenticateAgent(request))return fail(401,"UNAUTHORIZED");
  if(Number(request.headers.get("content-length")||0)>65536)return fail(413,"REQUEST_TOO_LARGE");
  const reader=request.body?.getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try {
    if(reader)while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>65536){await reader.cancel();return fail(413,"REQUEST_TOO_LARGE");}chunks.push(part.value);}
  } catch {return fail(400,"INVALID_REQUEST");}
  const body=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
  try {
    await ensureSmsSchema(db);
    return protect(await handleBridge(new Request(request.url,{method:"POST",headers:request.headers,body})));
  } catch {return fail(503,"BRIDGE_UNAVAILABLE");}
}
