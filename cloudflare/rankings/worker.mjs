import { BlastCore, WORDS } from './blast-rules.mjs';
const MAX=2147483647;
const mainModes=new Set(['core','core_level1','core_level2','core_level3','core_level4','shino','sushi','antoni','wordrush','typing_tower','hayaoshi_beginner','hayaoshi_intermediate','hayaoshi_advanced','sushi_quiz_solo','clock','clock_typing','sushi_idiom','wordrush3d','sushi_slash','sushi_cross','sushi_dungeon','sushi_kobun']);
mainModes.add("kobun_connect");
const dailyModes=new Set(['core','core_level1','core_level2','core_level3','core_level4','sushi_idiom']);
const columns={scores:['id','player_name','score','max_combo','accuracy','mode','created_at'],sushi_parts_runs:['id','player_id','player_name','score','stage','cleared','final_boss_defeated','discovered_words','unlocked_roots','max_combo','best_word','created_at'],sushi_parts_collection:['id','player_id','player_name','word','meaning','parts','root','freq','discovered_count','first_discovered_at','last_discovered_at']};
function check(ok,message='invalid_input'){if(!ok)throw Object.assign(Error(message),{status:400})}
function integer(v,max=MAX){check(Number.isInteger(v)&&v>=0&&v<=max);return v}
function text(v,max=160){check(typeof v==='string'&&v.trim()&&[...v].length<=max&&!/[\u0000-\u001f\u007f]/.test(v));return v.trim()}
function mode(v,source){check(source==='main'?mainModes.has(v):['ielts','systan','systan3','systan4','typing_game'].includes(v)||/^typing_game_(wordSet|essayTemplate|versatileShorts|task1Expressions|reusableExpressions|eikenExpressions|academicExpressions)_(timeAttack|endless|word|battle)$/.test(v));return v}
const stmt=(env,sql,args=[])=>env.DB.prepare(sql).bind(...args);
const all=async(env,sql,args=[]) => (await stmt(env,sql,args).all()).results;
const day=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
function bestStatement(env,source,b){
 const name=text(b.p_player_name,100),score=integer(b.p_score),combo=integer(b.p_max_combo??0),accuracy=integer(b.p_accuracy??0,100),m=mode(b.p_mode,source);
 const update=source==='typing'?'score=MAX(scores.score,excluded.score),max_combo=MAX(COALESCE(scores.max_combo,0),excluded.max_combo),accuracy=CASE WHEN excluded.score>scores.score THEN excluded.accuracy ELSE scores.accuracy END':'score=excluded.score,max_combo=excluded.max_combo,accuracy=excluded.accuracy WHERE excluded.score>scores.score';
 return stmt(env,`INSERT INTO scores(source,id,player_name,score,max_combo,accuracy,mode,created_at) VALUES (?,(SELECT MAX(COALESCE(MAX(id),0),1000000000000)+1 FROM scores WHERE source=?),?,?,?,?,?,?) ON CONFLICT(source,player_name,mode) DO UPDATE SET ${update}`,[source,source,name,score,combo,accuracy,m,new Date().toISOString()]);
}
function insertStatement(env,source,b){
 const name=text(b.player_name,100),score=integer(b.score??0),combo=integer(b.max_combo??0),accuracy=integer(b.accuracy??0,100),m=mode(b.mode??'core',source);
 return stmt(env,'INSERT INTO scores(source,id,player_name,score,max_combo,accuracy,mode,created_at) VALUES (?,(SELECT MAX(COALESCE(MAX(id),0),1000000000000)+1 FROM scores WHERE source=?),?,?,?,?,?,?)',[source,source,name,score,combo,accuracy,m,new Date().toISOString()]);
}
async function rpc(env,source,name,b){
 if(name==='get_daily_high_scores'){
  check(source==='main'&&dailyModes.has(b.p_mode));const limit=Math.max(1,Math.min(100,b.p_limit??50));check(Number.isInteger(limit));
  return all(env,'SELECT player_name,score,max_combo,accuracy,mode FROM daily_high_scores WHERE mode=? AND score_date=? ORDER BY score DESC,max_combo DESC,accuracy DESC,achieved_at,player_key LIMIT ?',[b.p_mode,day(),limit]);
 }
 check(['save_high_score','save_score_with_daily','save_typing_tower_score'].includes(name));
 if(name==='save_typing_tower_score'){
  check(source==='main');await insertStatement(env,source,{player_name:b.p_player_name,score:b.p_score,max_combo:b.p_max_combo,accuracy:Math.round(b.p_accuracy),mode:'typing_tower'}).run();return null;
 }
 if(name==='save_score_with_daily'){
  check(source==='main'&&dailyModes.has(b.p_mode));b={...b,p_player_name:[...String(b.p_player_name??'').normalize('NFKC').replace(/\s+/g,' ').trim()].slice(0,20).join('')||'NO NAME'};
  const statements=[bestStatement(env,source,b),stmt(env,`INSERT INTO daily_high_scores(mode,score_date,player_key,player_name,score,max_combo,accuracy,achieved_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(mode,score_date,player_key) DO UPDATE SET player_name=excluded.player_name,score=excluded.score,max_combo=excluded.max_combo,accuracy=excluded.accuracy,achieved_at=excluded.achieved_at WHERE (excluded.score,excluded.max_combo,excluded.accuracy)>(daily_high_scores.score,daily_high_scores.max_combo,daily_high_scores.accuracy)`,[b.p_mode,day(),b.p_player_name.toLowerCase(),b.p_player_name,b.p_score,b.p_max_combo,b.p_accuracy,new Date().toISOString()])];
  await env.DB.batch(statements);
 }else await bestStatement(env,source,b).run();
 return null;
}
async function readTable(env,source,table,u,request){
 check(columns[table]&&(source==='main'||table==='scores'));
 const fields=u.searchParams.get('select')||'*',selected=fields==='*'?columns[table]:fields.split(',').map(x=>x.trim());check(selected.length>0&&selected.every(x=>columns[table].includes(x)));
 const where=[],args=[];if(table==='scores'){where.push('source=?');args.push(source)}
 for(const [key,value] of u.searchParams){
  if(['select','order','limit','offset','on_conflict'].includes(key))continue;
  check(columns[table].includes(key));
  const dot=value.indexOf('.'),op=value.slice(0,dot),val=value.slice(dot+1);
  if(op==='in'){check(key==='mode'&&/^\([^()]+\)$/.test(val));const list=val.slice(1,-1).split(',').map(x=>x.replace(/^"|"$/g,''));check(list.length<=20);list.forEach(x=>mode(x,source));where.push(`${key} IN (${list.map(()=>'?').join(',')})`);args.push(...list)}
  else{check(['eq','gte','lte'].includes(op));if(key==='mode')mode(val,source);where.push(`${key}${{eq:'=',gte:'>=',lte:'<='}[op]}?`);args.push(val)}
 }
 const order=(u.searchParams.get('order')|| (table==='scores'?'score.desc,id.asc':'id.asc')).split(',').map(term=>{const [key,direction='asc']=term.split('.');check(columns[table].includes(key)&&['asc','desc'].includes(direction));return key+' '+direction.toUpperCase()}).join(',');
 const limit=Number(u.searchParams.get('limit')||1000),offset=Number(u.searchParams.get('offset')||0);check(Number.isInteger(limit)&&limit>0&&limit<=10000&&Number.isInteger(offset)&&offset>=0&&offset<=100000);
 const rows=await all(env,`SELECT ${selected.join(',')} FROM ${table}${where.length?' WHERE '+where.join(' AND '):''} ORDER BY ${order} LIMIT ? OFFSET ?`,[...args,limit,offset]);
 for(const row of rows){if(row.parts&&typeof row.parts==='string')row.parts=JSON.parse(row.parts);for(const key of ['cleared','final_boss_defeated'])if(row[key]!==null&&row[key]!==undefined)row[key]=!!row[key]}
 if(request.headers.get('accept')?.includes('vnd.pgrst.object+json')){if(rows.length!==1)throw Object.assign(Error('not_single'),{status:406});return rows[0]}
 return rows;
}
async function writeTable(env,source,table,b,request){
 const rows=Array.isArray(b)?b:[b];check(rows.length>0&&rows.length<=50);
 if(table==='scores'){
  check(request.method==='POST');await env.DB.batch(rows.map(row=>insertStatement(env,source,row)));return null;
 }
 if(source==='main'&&table==='sushi_parts_collection'&&request.method==='PATCH'){
  check(!Array.isArray(b));const u=new URL(request.url),identity=b.player_id&&b.word?{player_id:b.player_id,word:b.word}:Object.fromEntries(['id','player_id','word'].filter(key=>u.searchParams.has(key)).map(key=>{const value=u.searchParams.get(key);check(value.startsWith('eq.'));return [key,value.slice(3)]}));
  check(identity.id||identity.player_id&&identity.word);const keys=Object.keys(identity),args=keys.map(key=>text(identity[key],160)),updates=[],values=[];
  for(const [key,value] of Object.entries(b)){
   if(['id','player_id','word'].includes(key))continue;check(columns.sushi_parts_collection.includes(key));
   if(key==='discovered_count'){updates.push('discovered_count=MAX(COALESCE(discovered_count,0),?)');values.push(integer(value))}
   else if(key==='parts'){check(Array.isArray(value)&&value.length<=30&&value.every(part=>typeof part==='string'&&part.length<=100));updates.push('parts=?');values.push(JSON.stringify(value))}
   else{check(value===null||typeof value==='string'&&value.length<=10000);updates.push(key+'=?');values.push(value)}
  }
  check(updates.length);await stmt(env,`UPDATE sushi_parts_collection SET ${updates.join(',')} WHERE ${keys.map(key=>key+'=?').join(' AND ')}`,[...values,...args]).run();return null;
 }
 check(source==='main'&&['sushi_parts_runs','sushi_parts_collection'].includes(table)&&request.method==='POST');
 const statements=[];
 for(const row of rows){
  check(row&&typeof row==='object');text(row.player_id,160);text(row.player_name,100);check(typeof row.id==='string'&&/^[a-f0-9-]{36}$/i.test(row.id));
  let data;
  if(table==='sushi_parts_runs'){
   data={id:row.id,player_id:row.player_id,player_name:row.player_name,score:integer(row.score??0),stage:integer(row.stage??1),cleared:row.cleared?1:0,final_boss_defeated:row.final_boss_defeated?1:0,discovered_words:integer(row.discovered_words??0),unlocked_roots:integer(row.unlocked_roots??0),max_combo:integer(row.max_combo??0),best_word:String(row.best_word||'').slice(0,150),created_at:new Date().toISOString()};
  }else{
   text(row.word,150);check(!row.parts||Array.isArray(row.parts)&&row.parts.length<=30&&row.parts.every(p=>typeof p==='string'&&p.length<=100));
   data={id:row.id,player_id:row.player_id,player_name:row.player_name,word:row.word,meaning:String(row.meaning||'').slice(0,10000),parts:JSON.stringify(row.parts||[]),root:String(row.root||'').slice(0,150),freq:row.freq==null?null:String(row.freq).slice(0,50),discovered_count:integer(row.discovered_count??1),first_discovered_at:new Date().toISOString(),last_discovered_at:new Date().toISOString()};
  }
  const keys=Object.keys(data),conflict=table==='sushi_parts_runs'?'ON CONFLICT(id) DO NOTHING':'ON CONFLICT(player_id,word) DO UPDATE SET player_name=excluded.player_name,meaning=excluded.meaning,parts=excluded.parts,root=excluded.root,discovered_count=MAX(sushi_parts_collection.discovered_count,excluded.discovered_count),last_discovered_at=excluded.last_discovered_at';
  statements.push(stmt(env,`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(()=>'?').join(',')}) ${conflict}`,Object.values(data)));
 }
 await env.DB.batch(statements);return null;
}
const encode=s=>btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const decode=s=>atob(s.replace(/-/g,'+').replace(/_/g,'/'));
async function blast(env,b){
 check(['start','list','submit'].includes(b.action));
 if(b.action==='list'){
  check(['normal','daily'].includes(b.mode)&&['all','week','today'].includes(b.scope));let where='mode=?',args=[b.mode];
  if(b.scope==='today'){where+=' AND played_day=?';args.push(day())}
  if(b.scope==='week'){const d=new Date(day()+'T00:00:00+09:00'),weekday=new Date(Date.now()+9*3600000).getUTCDay();d.setUTCDate(d.getUTCDate()-(weekday+6)%7);where+=' AND created_at>=?';args.push(d.toISOString())}
  return {rows:await all(env,`SELECT name,score,combo,extra,played_day,created_at FROM sushi_blast_scores_v2 WHERE ${where} ORDER BY score DESC,created_at ASC LIMIT 50`,args)};
 }
 check(typeof env.BLAST_SIGNING_KEY==='string'&&env.BLAST_SIGNING_KEY.length>=32,'signing_key_missing');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.BLAST_SIGNING_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 if(b.action==='start'){
  check(['normal','daily'].includes(b.mode)&&b.version===BlastCore.version);const seed=b.mode==='daily'?BlastCore.dailySeed(day()):integer(b.seed,4294967295);
  const data={id:crypto.randomUUID(),version:BlastCore.version,mode:b.mode,day:day(),seed,iat:Date.now(),exp:Date.now()+86400000};const payload=encode(JSON.stringify(data));const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(payload));
  return {seed,day:data.day,token:payload+'.'+encode(String.fromCharCode(...new Uint8Array(sig)))};
 }
 check(typeof b.token==='string'&&b.token.length<2000&&b.version===BlastCore.version);const [payload,signature]=b.token.split('.');
 check(!!signature&&await crypto.subtle.verify('HMAC',key,Uint8Array.from(decode(signature),c=>c.charCodeAt(0)),new TextEncoder().encode(payload)),'invalid_session');const s=JSON.parse(decode(payload));check(s.exp>=Date.now()&&s.version===BlastCore.version,'expired_session');
 const name=text(b.name,12),r=BlastCore.replay(s.seed,s.mode,b.events,WORDS),now=new Date().toISOString();integer(r.score,Number.MAX_SAFE_INTEGER);
 // Atomic insert/replace-best in one D1 transaction; the signed run ID is idempotent.
 const args=[name,s.mode,...(s.mode==='daily'?[s.day]:[])],where='name=? AND mode=?'+(s.mode==='daily'?' AND played_day=?':'');
 await env.DB.batch([
  stmt(env,`INSERT INTO sushi_blast_scores_v2(id,name,mode,played_day,score,moves,combo,extra,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM sushi_blast_scores_v2 WHERE ${where} AND score>=?) ON CONFLICT(id) DO NOTHING`,[s.id,name,s.mode,s.day,r.score,r.moves,r.combo,r.extra,now,...args,r.score]),
  stmt(env,`DELETE FROM sushi_blast_scores_v2 WHERE ${where} AND id<>? AND score<? AND EXISTS(SELECT 1 FROM sushi_blast_scores_v2 WHERE id=?)`,[...args,s.id,r.score,s.id])
 ]);
 const rows=await all(env,`SELECT score FROM sushi_blast_scores_v2 WHERE ${where} ORDER BY score DESC LIMIT 1`,args);return {score:rows[0].score,keptBest:rows[0].score>r.score};
}
export default {async fetch(request,env){
 const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':env.PUBLIC_ORIGIN||'https://sushitan.net','Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS','Access-Control-Allow-Headers':'content-type,accept,prefer,range','Cache-Control':'no-store','Vary':'Origin'};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 try{
  const u=new URL(request.url);if(u.pathname.endsWith('/health'))return reply({ready:env.RANKINGS_READY==='true'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(env.RANKINGS_READY!=='true')return reply({error:'migration_not_verified'},503);
  const origin=request.headers.get('origin');if(origin&&origin!==headers['Access-Control-Allow-Origin'])return reply({error:'origin_not_allowed'},403);
  check(['GET','POST','PATCH'].includes(request.method));
  const limiter=request.method==='GET'?env.READ_LIMIT:env.WRITE_LIMIT;
  if(!limiter)return reply({error:'rate_limit_not_configured'},503);
  if(!(await limiter.limit({key:request.headers.get('CF-Connecting-IP')||'unknown'})).success)return reply({error:'rate_limited'},429);
  let b=null;if(request.method!=='GET'){const body=await request.text();check(body.length<=180000,'body_too_large');b=JSON.parse(body);check(b&&typeof b==='object')}
  if(u.pathname==='/api/rankings/blast')return reply(await blast(env,b));
  const match=u.pathname.match(/^\/api\/rankings\/(main|typing)\/rest\/v1\/(rpc\/)?([a-z_]+)$/);check(match,'unknown_endpoint');const [,source,isRPC,name]=match;
  if(isRPC){check(request.method==='POST');return reply(await rpc(env,source,name,b))}
  return reply(request.method==='GET'?await readTable(env,source,name,u,request):await writeTable(env,source,name,b,request));
 }catch(error){if(/UNIQUE constraint failed/.test(error.message))return reply({code:'23505',message:'duplicate key value violates unique constraint'},409);return reply({error:error.status===400?error.message:'ranking_unavailable',message:error.status===400?error.message:'ランキングに接続できませんでした'},error.status||503)}
}};
