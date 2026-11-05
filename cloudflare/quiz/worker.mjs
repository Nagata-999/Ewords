const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const check=(ok,message='入力を確認してください。',status=400)=>{if(!ok)fail(message,status)};
const stmt=(env,sql,args=[])=>env.DB.prepare(sql).bind(...args);
const rows=async(env,sql,args=[])=> (await stmt(env,sql,args).all()).results;
const one=async(env,sql,args=[])=> (await rows(env,sql,args))[0];
const parse=row=>row?JSON.parse(row.data):null;
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const host=(room,key)=>check(key&&room.host_token===key,'ホスト権限がありません。',403);
function points(elapsed,streak){const base=Math.max(0,10-Math.floor(Math.floor(Math.max(0,elapsed)/1000)/2));return Math.round(base*Math.min(2,streak+1<3?1:1+(streak-1)*0.1))}
const publicRoom=room=>parse(room);
async function getRoom(env,code){check(/^\d{4,8}$/.test(code));const room=await one(env,'SELECT * FROM quiz_rooms WHERE code=? AND expires_at>?',[code,Date.now()]);check(room,'部屋が見つかりません。有効期限は24時間です。',404);return room}
async function state(env,room,key){
 const ps=await rows(env,'SELECT * FROM quiz_players WHERE room_code=? ORDER BY id LIMIT 100',[room.code]);
 const allowed=key&&(key===room.host_token||ps.some(p=>p.player_token===key));
 const s=publicRoom(room);
 if(!allowed)return {session:{code:s.code,status:s.status,length:s.length,q_index:s.q_index},players:[]};
 return {session:s,players:ps.map(parse)};
}
async function answer(env,room,key,id,b){
 const p=await one(env,'SELECT * FROM quiz_players WHERE id=? AND room_code=?',[id,room.code]);
 check(p&&key&&p.player_token===key,'参加者権限がありません。',403);
 const s=parse(room),me=parse(p),q=s.current_question,now=Date.now();
 check(q&&['question','buzzer_question'].includes(s.status),'この問題の回答受付は終了しました。',409);
 check(b.answered_q_index===s.q_index&&integer(b.last_answer,0,3),'古い問題への回答です。',409);
 check(now-Number(q.started_at)<=20500,'回答時間が終了しました。',409);
 const isBuzzer=s.status==='buzzer_question';
 check(!isBuzzer||Number(me.meta?.freeze_until||0)<=now,'まだ回答できません。',409);
 check(isBuzzer||me.answered_q_index!==s.q_index,'回答済みです。',409);
 const correct=b.last_answer===q.ans;
 const next={...me,last_answer:b.last_answer,answered_q_index:s.q_index,meta:{...me.meta,answered_at:now}};
 if(!isBuzzer){
  await stmt(env,"UPDATE quiz_players SET data=? WHERE id=? AND json_extract(data,'$.answered_q_index')!=? AND EXISTS(SELECT 1 FROM quiz_rooms WHERE code=? AND json_extract(data,'$.status')='question' AND json_extract(data,'$.q_index')=?)",[JSON.stringify(next),id,s.q_index,room.code,s.q_index]).run();
 }else if(correct){
  const gained=points(now-q.started_at,Number(me.meta?.current_streak||0));
  next.score=me.score+gained;next.correct=me.correct+1;
  next.meta={...next.meta,buzzer_answer:b.last_answer,buzzer_correct:true,buzzer_winner_q:s.q_index,last_gained:gained,current_streak:Number(me.meta?.current_streak||0)+1};
  await env.DB.batch([
   stmt(env,"UPDATE quiz_rooms SET winner_id=?,data=json_set(data,'$.status','buzzer_result') WHERE code=? AND winner_id IS NULL AND json_extract(data,'$.status')='buzzer_question' AND json_extract(data,'$.q_index')=?",[id,room.code,s.q_index]),
   stmt(env,"UPDATE quiz_players SET data=? WHERE id=? AND EXISTS(SELECT 1 FROM quiz_rooms WHERE code=? AND winner_id=? AND json_extract(data,'$.q_index')=?) AND COALESCE(json_extract(data,'$.meta.buzzer_winner_q'),-1)!=?",[JSON.stringify(next),id,room.code,id,s.q_index,s.q_index])
  ]);
  const latest=await getRoom(env,room.code);check(latest.winner_id===id,'ほかの参加者が先に正解しました。',409);
 }else{
  next.meta={...next.meta,buzzer_answer:b.last_answer,buzzer_correct:false,buzzer_locked:true,freeze_until:now+6000,current_streak:0};
  await stmt(env,"UPDATE quiz_players SET data=? WHERE id=? AND EXISTS(SELECT 1 FROM quiz_rooms WHERE code=? AND winner_id IS NULL AND json_extract(data,'$.status')='buzzer_question' AND json_extract(data,'$.q_index')=?)",[JSON.stringify(next),id,room.code,s.q_index]).run();
 }
 return {data:parse(await one(env,'SELECT data FROM quiz_players WHERE id=?',[id]))};
}
async function write(env,room,key,b){
 const value=b.value||{};const s=parse(room);
 if(b.action==='join'){
  check(['lobby','buzzer_lobby'].includes(s.status),'開始済みの部屋には参加できません。',409);
  const name=String(value.name||'').normalize('NFKC').trim();check(name.length>0&&name.length<=100&&!/[<>\u0000-\u001f]/.test(name));
  const id=crypto.randomUUID(),secret=token(),data={id,session_code:room.code,name,score:0,correct:0,last_answer:null,answered_q_index:-1,meta:{current_streak:0}};
  const result=await stmt(env,"INSERT INTO quiz_players(id,room_code,player_token,data) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM quiz_players WHERE room_code=?)<100 AND EXISTS(SELECT 1 FROM quiz_rooms WHERE code=? AND json_extract(data,'$.status') IN ('lobby','buzzer_lobby')) RETURNING id",[id,room.code,secret,JSON.stringify(data),room.code,room.code]).all();
  check(result.results.length,'参加できません。部屋が満員か、開始済みです。',409);return {data,token:secret};
 }
 if(b.action==='player'&&key!==room.host_token)return answer(env,room,key,b.id,value);
 if(b.action==='session'&&key!==room.host_token){
  const winner=await one(env,'SELECT player_token FROM quiz_players WHERE id=?',[room.winner_id||'']);
  check(value.status==='buzzer_result'&&Object.keys(value).length===1&&winner?.player_token===key,'ホスト権限がありません。',403);return {data:s};
 }
 host(room,key);
 if(b.action==='scores'){
  check(value.q_index===s.q_index,'古い問題の集計です。',409);
  if(s.status==='result')return {data:s};
  check(s.status==='question'&&Array.isArray(value.players)&&value.players.length<=100);
  const ps=await rows(env,'SELECT * FROM quiz_players WHERE room_code=?',[room.code]);
  const writes=[];
  for(const p of ps){const next=value.players.find(v=>v.id===p.id);check(next&&integer(next.score,0,1000000)&&integer(next.correct,0,1000));const old=parse(p);writes.push(stmt(env,'UPDATE quiz_players SET data=? WHERE id=?',[JSON.stringify({...old,score:next.score,correct:next.correct,meta:{...old.meta,...next.meta}}),p.id]))}
  writes.push(stmt(env,"UPDATE quiz_rooms SET data=json_set(data,'$.status','result') WHERE code=?",[room.code]));await env.DB.batch(writes);return {data:{...s,status:'result'}};
 }
 if(b.action==='reset')return {data:null}; // Starting a question resets players atomically below.
 if(b.action==='player'){
  const p=await one(env,'SELECT * FROM quiz_players WHERE id=? AND room_code=?',[b.id,room.code]);check(p,'参加者が見つかりません。',404);
  check(integer(value.score,0,1000000)&&integer(value.correct,0,1000));
  const old=parse(p);const data={...old,score:value.score,correct:value.correct,meta:{...old.meta,...value.meta}};
  await stmt(env,'UPDATE quiz_players SET data=? WHERE id=?',[JSON.stringify(data),b.id]).run();return {data};
 }
 check(b.action==='session');
 if(value.current_question){
  const q=value.current_question;check(['question','buzzer_question'].includes(value.status)&&integer(value.q_index,0,99));
  check((s.status.startsWith('buzzer')?value.status==='buzzer_question':value.status==='question'));
  check(typeof q.q==='string'&&q.q.length<=3000&&Array.isArray(q.choices)&&q.choices.length===4&&q.choices.every(x=>typeof x==='string'&&x.length<=1500)&&integer(q.ans,0,3));
  check(value.q_index>=s.q_index&&value.q_index<=s.q_index+1&&value.q_index<s.length);
  const data={...s,status:value.status,q_index:value.q_index,current_question:{...q,started_at:Date.now()}};
  await env.DB.batch([
   stmt(env,'UPDATE quiz_rooms SET data=?,winner_id=NULL WHERE code=?',[JSON.stringify(data),room.code]),
   stmt(env,"UPDATE quiz_players SET data=json_set(json_remove(data,'$.meta.buzzer_winner_q'),'$.last_answer',NULL,'$.answered_q_index',-1,'$.meta.buzzer_locked',json('false'),'$.meta.freeze_until',0) WHERE room_code=?",[room.code])
  ]);return {data};
 }
 check(['result','buzzer_result'].includes(value.status));check(value.status===(s.status.startsWith('buzzer')?'buzzer_result':'result'));
 const data={...s,status:value.status};await stmt(env,'UPDATE quiz_rooms SET data=? WHERE code=?',[JSON.stringify(data),room.code]).run();return {data};
}
export default {async fetch(request,env){try{
 const url=new URL(request.url),origin=request.headers.get('Origin');
 check(!origin||origin===(env.PUBLIC_ORIGIN||'https://sushitan.net'),'この接続元からは利用できません。',403);
 check(env.DB&&env.QUIZ_READY==='true','クイズ通信は準備中です。',503);
 const key=request.headers.get('X-Quiz-Token')||'';check(key.length<=100);
 if(env.QUIZ_LIMIT){const limit=await env.QUIZ_LIMIT.limit({key:'quiz:'+ (key||request.headers.get('CF-Connecting-IP')||'unknown')});check(limit.success,'通信が多いため、少し待って再試行してください。',429)}
 const match=url.pathname.match(/^\/api\/quiz\/rooms(?:\/(\d{4,8}))?$/);check(match,'見つかりません。',404);
 if(request.method==='GET'){check(match[1]);return json(await state(env,await getRoom(env,match[1]),key))}
 check(request.method==='POST','対応していない操作です。',405);
 check(request.headers.get('Content-Type')?.includes('application/json'));
 const raw=await request.text();check(raw.length<=65536,'送信データが大きすぎます。',413);const b=JSON.parse(raw);
 if(!match[1]){
  check(b.action==='create');const v=b.value||{};check(/^\d{4,8}$/.test(v.code)&&['lobby','buzzer_lobby'].includes(v.status)&&[5,10,15,20].includes(v.length));
  const secret=token(),data={code:v.code,status:v.status,category:'Custom',length:v.length,q_index:0,current_question:null};
  const result=await stmt(env,'INSERT INTO quiz_rooms(code,host_token,data,expires_at) VALUES(?,?,?,?) ON CONFLICT(code) DO NOTHING RETURNING code',[v.code,secret,JSON.stringify(data),Date.now()+86400000]).all();
  check(result.results.length,'部屋番号が使用中です。もう一度作成してください。',409);return json({data,token:secret});
 }
 return json(await write(env,await getRoom(env,match[1]),key,b));
 }catch(error){if(error instanceof SyntaxError)return json({message:'入力を確認してください。'},400);return json({message:error.status?error.message:'通信に失敗しました。少し待って再試行してください。'},error.status||503)}}};
