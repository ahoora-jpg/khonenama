const account=process.env.CLOUDFLARE_ACCOUNT_ID;
for(const suffix of ['/workers/account-settings','/workers/scripts/khonenama/settings','/subscriptions']){
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${suffix}`,{headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`}});const d=await r.json();const v=d.result||{};console.log(JSON.stringify({resource:suffix,status:r.status,success:d.success,usage_model:v.usage_model,default_usage_model:v.default_usage_model,limits:v.limits,default_limits:v.default_limits,subscriptions:Array.isArray(v)?v.map(x=>({name:x.rate_plan?.public_name||x.rate_plan?.id||x.product?.name,state:x.state})):undefined,errors:d.errors?.map(x=>({code:x.code,message:x.message}))}));
}
