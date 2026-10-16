const account=process.env.CLOUDFLARE_ACCOUNT_ID;
for(const suffix of ['/workers/account-settings','/workers/scripts/khonenama/settings']){
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${suffix}`,{headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`}});const d=await r.json();const v=d.result||{};console.log(JSON.stringify({resource:suffix,status:r.status,success:d.success,usage_model:v.usage_model,default_usage_model:v.default_usage_model,limits:v.limits,errors:d.errors?.map(x=>({code:x.code,message:x.message}))}));
}
