import { handleBridge } from "@/lib/server/sms/bridge";
export async function POST(request:Request){return handleBridge(request);}
