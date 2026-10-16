const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const url=`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/a991ffd9-0044-4821-8d69-3295ab6ea398/query`;
const headers={Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'};
let ready=false;
for(let attempt=0;attempt<12;attempt++){
 const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({sql:"SELECT name FROM sqlite_master WHERE type='table' AND name='profile_photo_reminders'"})});const d=await r.json();if(!r.ok||!d.success)throw Error('Reminder status query failed');
 if(d.result?.[0]?.results?.length){ready=true;break;}
 await new Promise(resolve=>setTimeout(resolve,10000));
}
if(!ready)throw Error('Scheduled reminder table has not appeared yet');
const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({sql:'SELECT state,COUNT(*) AS total FROM profile_photo_reminders GROUP BY state'})});const d=await r.json();if(!r.ok||!d.success)throw Error('Reminder summary query failed');console.log(JSON.stringify({scheduledSchemaReady:true,states:d.result[0].results}));
