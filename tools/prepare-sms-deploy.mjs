import fs from 'node:fs';
const built=JSON.parse(fs.readFileSync('dist/server/wrangler.json','utf8')),source=JSON.parse(fs.readFileSync('wrangler.sms.jsonc','utf8'));
const sms={...built,...source,main:'index.js',assets:built.assets,no_bundle:true};
for(const k of ['configPath','userConfigPath','topLevelName'])delete sms[k];
if(process.argv.includes('--staging')){sms.routes=[];sms.queues={...sms.queues,consumers:[]};}
fs.writeFileSync('dist/server/wrangler.sms.json',JSON.stringify(sms,null,2));
console.log('Prepared isolated SMS worker configuration; no site database binding.');
