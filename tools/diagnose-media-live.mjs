// Print upload error messages only; never print request headers or credentials.
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
const base=`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/khonenama/tails`;
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
const created=await fetch(base,{method:'POST',headers,body:'{}'});
const data=await created.json();
if(!data.success)throw Error('Cannot open worker diagnostic stream');
const socket=new WebSocket(data.result.url);
console.log('MEDIA_DIAGNOSTIC_READY');
socket.addEventListener('message',event=>{
  try{const record=JSON.parse(String(event.data));
    for(const log of record.logs||[])if(log.level==='error')console.log('Worker error:',JSON.stringify(log.message));
    for(const error of record.exceptions||[])console.log('Worker exception:',error.name,error.message);
  }catch{}
});
await new Promise(resolve=>setTimeout(resolve,90000));
socket.close();
await fetch(base+'/'+data.result.id,{method:'DELETE',headers});
