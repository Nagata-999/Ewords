// Read-only Supabase export, repeatable D1 import and row-by-row verification.
// Node >=24. Keep tokens in environment variables; never in source or browser code.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const projects={main:'rxyoyveykxdfrpomkltl',typing:'ykrjocftuflnkubaxrza'};
const tables={main:['scores','daily_high_scores','sushi_blast_scores_v2','sushi_parts_runs','sushi_parts_collection'],typing:['scores']};
const snapshotFile=process.env.RANKING_SNAPSHOT||'ranking-snapshot.json';
const sha=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
async function http(url,init){const r=await fetch(url,{...init,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`HTTP ${r.status}: ${new URL(url).hostname}`);return r.json()}
async function query(sql,params=[]){
 if(!process.env.CLOUDFLARE_API_TOKEN||!process.env.CLOUDFLARE_ACCOUNT_ID||!process.env.D1_DATABASE_ID)throw Error('Set CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and D1_DATABASE_ID');
 const data=await http(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.D1_DATABASE_ID}/query`,{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(Array.isArray(sql)?{batch:sql}:{sql,params})});
 if(!data.success||data.result?.some(x=>!x.success))throw Error('D1 query failed');return data.result;
}
export function normalize(row){const value={...row};for(const key of Object.keys(value)){if(typeof value[key]==='boolean')value[key]=Number(value[key]);if(key.endsWith('_at')&&value[key])value[key]=new Date(value[key]).toISOString();if(key==='parts'&&typeof value[key]!=='string'&&value[key]!==null)value[key]=JSON.stringify(value[key])}return value}
export function importStatement(source,table,row){
 if(!tables[source]?.includes(table))throw Error('Unknown ranking table');const r=normalize(row);if(table==='scores')r.source=source;
 const keys=Object.keys(r);if(keys.some(k=>!/^[a-z_]+$/.test(k)))throw Error('invalid column');
 let conflict;
 if(table==='scores')conflict=source==='main'?'ON CONFLICT(source,player_name,mode) DO UPDATE SET score=excluded.score,max_combo=excluded.max_combo,accuracy=excluded.accuracy WHERE excluded.score>scores.score':'ON CONFLICT(source,player_name,mode) DO UPDATE SET score=MAX(scores.score,excluded.score),max_combo=MAX(COALESCE(scores.max_combo,0),COALESCE(excluded.max_combo,0)),accuracy=CASE WHEN excluded.score>scores.score THEN excluded.accuracy ELSE scores.accuracy END';
 else if(table==='daily_high_scores')conflict='ON CONFLICT(mode,score_date,player_key) DO UPDATE SET player_name=excluded.player_name,score=excluded.score,max_combo=excluded.max_combo,accuracy=excluded.accuracy,achieved_at=excluded.achieved_at WHERE (excluded.score,excluded.max_combo,excluded.accuracy)>(daily_high_scores.score,daily_high_scores.max_combo,daily_high_scores.accuracy)';
 else if(table==='sushi_parts_collection')conflict='ON CONFLICT(player_id,word) DO UPDATE SET discovered_count=MAX(COALESCE(sushi_parts_collection.discovered_count,0),COALESCE(excluded.discovered_count,0)),last_discovered_at=MAX(COALESCE(sushi_parts_collection.last_discovered_at,\'\'),COALESCE(excluded.last_discovered_at,\'\'))';
 else conflict='ON CONFLICT(id) DO NOTHING';
 return {sql:`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(()=>'?').join(',')}) ${conflict};`,params:Object.values(r)};
}
function identity(source,table,row){
 if(table==='scores')return {where:'source=? AND player_name=? AND mode IS ?',params:[source,row.player_name,row.mode]};
 if(table==='daily_high_scores')return {where:'mode=? AND score_date=? AND player_key=?',params:[row.mode,row.score_date,row.player_key]};
 if(table==='sushi_parts_collection')return {where:'player_id=? AND word=?',params:[row.player_id,row.word]};
 return {where:'id=?',params:[row.id]};
}
async function exportSource(){
 if(!process.env.SUPABASE_ACCESS_TOKEN)throw Error('Set SUPABASE_ACCESS_TOKEN (server-side management token)');
 const data={};
 for(const [source,list] of Object.entries(tables)){data[source]={};for(const table of list){let rows=[];for(let offset=0;;offset+=500){
  const order=table==='daily_high_scores'?'mode,score_date,player_key':'id';
  const batch=await http(`https://api.supabase.com/v1/projects/${projects[source]}/database/query`,{method:'POST',headers:{Authorization:'Bearer '+process.env.SUPABASE_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({query:`SELECT * FROM public.${table} ORDER BY ${order} LIMIT 500 OFFSET ${offset}`})});
  if(!Array.isArray(batch))throw Error('Invalid export response');rows.push(...batch);if(batch.length<500)break;
 }data[source][table]=rows}}
 await fs.writeFile(snapshotFile,JSON.stringify(data));await fs.writeFile(snapshotFile+'.export.json',JSON.stringify({at:new Date().toISOString(),sha256:sha(data)}));return data;
}
async function apply(data){
 await query(await fs.readFile(new URL('./schema.sql',import.meta.url),'utf8'));
 let count=0;
 // 25 rows/query, bounded statement size. Natural keys/IDs make every batch replayable.
 for(const [source,list] of Object.entries(data))for(const [table,rows] of Object.entries(list))for(let i=0;i<rows.length;i+=25){
  const statements=rows.slice(i,i+25).map(row=>importStatement(source,table,row));
  await query(statements);count+=statements.length;
 }
 return count;
}
async function verify(data){
 let count=0;
 for(const [source,list] of Object.entries(data))for(const [table,rows] of Object.entries(list)){
  for(let i=0;i<rows.length;i+=25){
   const batch=rows.slice(i,i+25),ids=batch.map(r=>identity(source,table,r));
   const results=await query(ids.map(id=>({sql:`SELECT * FROM ${table} WHERE ${id.where};`,params:id.params})));
   for(let j=0;j<batch.length;j++){
    const expected=normalize(batch[j]),actual=results[j]?.results;
    if(actual?.length!==1)throw Error(`Missing or ambiguous row: ${source}/${table}`);
    // Before cutover the copy must match every source column, not just counts.
    for(const [key,value] of Object.entries(expected))if(actual[0][key]!==value)throw Error(`Mismatch: ${source}/${table}/${key}`);
    count++;
   }
  }
 }
 await fs.writeFile(snapshotFile+'.verified.json',JSON.stringify({at:new Date().toISOString(),sha256:sha(data),rows:count}));return count;
}
async function main(){
 const action=process.argv[2];
 if(action==='export'){const d=await exportSource();console.log(Object.fromEntries(Object.entries(d).map(([s,t])=>[s,Object.fromEntries(Object.entries(t).map(([n,r])=>[n,r.length]))])));return}
 const data=JSON.parse(await fs.readFile(snapshotFile,'utf8'));
 if(action==='import'){console.log('Imported',await apply(data));return}
 if(action==='verify'){console.log('Verified',await verify(data));return}
 if(action==='final'){const fresh=await exportSource();await apply(fresh);console.log('Final verified',await verify(fresh));return}
 throw Error('Usage: node migrate.mjs export|import|verify|final');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(e=>{console.error(e.message);process.exitCode=1});
