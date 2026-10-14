// Exact hostname/IP approved by the site owner. Never alter another DNS record.
const headers={Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
async function api(path,method='GET',body){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});const d=await r.json();if(!r.ok||!d.success)throw Error('Cloudflare DNS permission/request failed: '+r.status);return d.result;}
const zones=await api('/zones?name=khonenama.ir');
if(zones.length!==1)throw Error('Expected exact project zone');
const records=await api('/zones/'+zones[0].id+'/dns_records?name=payment.khonenama.ir');
if(records.length){if(records.length!==1||records[0].type!=='A'||records[0].content!=='185.126.5.141'||records[0].proxied)throw Error('Existing payment DNS differs; no record changed');console.log('Payment DNS already matches approved server');}
else{await api('/zones/'+zones[0].id+'/dns_records','POST',{type:'A',name:'payment.khonenama.ir',content:'185.126.5.141',ttl:300,proxied:false});console.log('Approved payment hostname created; payments remain disabled');}
