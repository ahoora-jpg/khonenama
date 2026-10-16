let ready=false;
for(let attempt=0;attempt<12;attempt++){
 const r=await fetch('https://khonenama.ir/api/health/db',{signal:AbortSignal.timeout(15000),cache:'no-store'});const d=await r.json();
 if(r.ok&&d.profileReminders?.configured&&d.profileReminders?.scheduleInitialized){ready=true;console.log(JSON.stringify({configured:true,scheduledSchemaReady:true}));break;}
 await new Promise(resolve=>setTimeout(resolve,10000));
}
if(!ready)throw Error('Scheduled reminder initialization is not confirmed');
