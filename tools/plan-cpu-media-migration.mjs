import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

// Offline migration planning only. Never imported by a Worker or public route.
const columns={
  media_type:"TEXT NOT NULL DEFAULT 'image'",
  provider:"TEXT NOT NULL DEFAULT 'imagekit'",
  provider_file_id:'TEXT',file_url:'TEXT',file_path:'TEXT',thumbnail_url:'TEXT',
};
export function planMediaColumns(existing){
  if(!Array.isArray(existing)||!existing.length||!existing.every(c=>typeof c==='string'))throw Error('Valid business_media column inventory required');
  if(!['id','business_id','kind','storage_key'].every(c=>existing.includes(c)))throw Error('Unexpected business_media schema; stop for manual review');
  return Object.entries(columns).filter(([name])=>!existing.includes(name)).map(([name,type])=>`ALTER TABLE business_media ADD COLUMN ${name} ${type};`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [input,output]=process.argv.slice(2);
  if(!input||!output)throw Error('Usage: node tools/plan-cpu-media-migration.mjs <column-inventory.json> <new-migration.sql>');
  const statements=planMediaColumns(JSON.parse(readFileSync(input,'utf8')));
  // Exclusive creation prevents overwriting another task's migration file.
  if(statements.length)writeFileSync(output,'-- Generated from a fresh schema inventory; apply once via D1 migrations.\n'+statements.join('\n')+'\n',{flag:'wx'});
  console.log(JSON.stringify({missingColumns:statements.length,fileCreated:statements.length>0}));
}
