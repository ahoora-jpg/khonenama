const values={PAYMENT_RELAY_URL:'https://payment.khonenama.ir',PAYMENT_RELAY_SECRET:process.env.PAYMENT_RELAY_SECRET,ZARINPAL_MERCHANT_ID:process.env.ZARINPAL_MERCHANT_ID,PAYMENT_PROVIDER:'zarinpal',PAYMENTS_ENABLED:'false'};
if(!values.PAYMENT_RELAY_SECRET||values.PAYMENT_RELAY_SECRET.length<32||!/^[a-f\d-]{36}$/i.test(values.ZARINPAL_MERCHANT_ID||''))throw Error('Missing private payment configuration');
for(const [name,text] of Object.entries(values)){
 const response=await fetch('https://api.cloudflare.com/client/v4/accounts/9bbb17f959c166a9e2b73c9a087c0beb/workers/scripts/khonenama/secrets',{method:'PUT',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({name,text,type:'secret_text'}),signal:AbortSignal.timeout(30000)});
 const result=await response.json();if(!response.ok||!result.success)throw Error('Payment configuration failed: '+response.status);
 console.log(name+' configured; charging disabled');
}
