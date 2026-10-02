import {randomBytes,pbkdf2Sync} from 'node:crypto';
const phone=process.env.TEST_BUSINESS_PHONE;
const password=process.env.TEST_BUSINESS_PASSWORD;
if(!/^09\d{9}$/.test(phone||'')||!password||password.length<8)throw Error('Invalid test account input');
async function query(sql,params=[]){const response=await fetch('https://api.cloudflare.com/client/v4/accounts/9bbb17f959c166a9e2b73c9a087c0beb/d1/database/a991ffd9-0044-4821-8d69-3295ab6ea398/query',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});const body=await response.json();if(!response.ok||!body.success)throw Error('D1 request failed: '+response.status+' '+JSON.stringify(body.errors));return body.result[0];}
const lookup=await query('SELECT id, CASE WHEN password_hash IS NULL OR password_hash = ? THEN 0 ELSE 1 END AS has_password FROM users WHERE phone = ? LIMIT 1',['',phone]);
const user=lookup.results?.[0];
if(!user)throw Error('Existing test account not found');
if(user.has_password){console.log('Existing password preserved; no changes');process.exit(0);}
const salt=randomBytes(16);const hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('hex');
const updated=await query("UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = 100000, password_set_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (password_hash IS NULL OR password_hash = '')",[hash,salt.toString('hex'),user.id]);
console.log(JSON.stringify({initialized:Number(updated.meta?.changes||0)===1}));
