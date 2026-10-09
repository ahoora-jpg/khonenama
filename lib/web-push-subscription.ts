const allowedHosts = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);
export function validPushEndpoint(value: unknown): value is string {
 if(typeof value!=="string"||value.length>2048)return false;
 try{const url=new URL(value);return url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&(allowedHosts.has(url.hostname)||url.hostname.endsWith(".notify.windows.com"));}catch{return false;}
}
export function cleanPushSubscription(value:any){
 if(!validPushEndpoint(value?.endpoint))return null;
 const p256dh=value?.keys?.p256dh,auth=value?.keys?.auth;
 if(typeof p256dh!=="string"||typeof auth!=="string"||!/^[A-Za-z0-9_-]{86,88}={0,2}$/.test(p256dh)||!/^[A-Za-z0-9_-]{22}={0,2}$/.test(auth))return null;
 return {endpoint:value.endpoint,expirationTime:null,keys:{p256dh,auth}};
}
