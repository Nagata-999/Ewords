const EVENT_ID=/^[A-Za-z0-9:_-]{1,159}$/,GAME_ID=/^[a-z0-9_-]{1,40}$/;
function invalid(message){return Object.assign(Error(message),{status:400})}
function conflict(message){return Object.assign(Error(message),{status:409})}
export function timestampOrder(value){
 const text=String(value),date=new Date(text);if(!Number.isFinite(date.getTime()))throw invalid('invalid_timestamp');
 const fraction=text.match(/\.(\d+)(?:Z|[+-]\d\d(?::?\d\d)?)$/)?.[1]||'';
 return date.toISOString().slice(0,19)+'.'+fraction.padEnd(6,'0').slice(0,6)+'Z';
}
export class ActivityStore {
 constructor(database){this.database=database}
 async loginVisit(account,now=Date.now()){
  const date=new Date(now+9*3600000),day=date.toISOString().slice(0,10),hour=date.getUTCHours(),previous=new Date(now+9*3600000-86400000).toISOString().slice(0,10);
  const row=await this.database.prepare(`INSERT INTO pin_sync_login_activity(account,last_day,streak,best_streak,hour_03,hour_05,hour_23,updated_at)
   VALUES(?,?,1,1,?,?,?,?) ON CONFLICT(account) DO UPDATE SET
   streak=CASE WHEN last_day=? THEN streak WHEN last_day=? THEN streak+1 WHEN last_day<? THEN 1 ELSE streak END,
   best_streak=MAX(best_streak,CASE WHEN last_day=? THEN streak+1 ELSE streak END),
   last_day=MAX(COALESCE(last_day,excluded.last_day),excluded.last_day),hour_03=hour_03 OR excluded.hour_03,hour_05=hour_05 OR excluded.hour_05,hour_23=hour_23 OR excluded.hour_23,updated_at=excluded.updated_at
   RETURNING *`).bind(account,day,Number(hour===3),Number(hour===5),Number(hour===23),new Date(now).toISOString(),day,previous,day,previous).first();
  return {ok:true,login:{lastDay:row.last_day,streak:row.streak,bestStreak:row.best_streak,hour03:Boolean(row.hour_03),hour05:Boolean(row.hour_05),hour23:Boolean(row.hour_23)}};
 }
 async achievementSync(account,input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw invalid('invalid_achievement_page');
  const raw=input.events??[],limit=input.limit??500,cursor=input.cursor??null,baseline=input.baseline;
  if(!Array.isArray(raw)||raw.length>500||!Number.isSafeInteger(limit)||limit<1||limit>500||(cursor!==null&&(typeof cursor!=='string'||!EVENT_ID.test(cursor))))throw invalid('invalid_achievement_page');
  if(!Number.isSafeInteger(baseline)||baseline<0||baseline>1000000000)throw invalid('invalid_achievement_baseline');
  const unique=new Map();
  for(const event of raw){
   if(event?.version!==2||typeof event.id!=='string'||!EVENT_ID.test(event.id)||typeof event.game!=='string'||!GAME_ID.test(event.game)||!Number.isSafeInteger(event.correct)||event.correct<1||event.correct>1000||typeof event.at!=='number'||!Number.isFinite(event.at)||event.at<0||event.at>8640000000000000)throw invalid('invalid_achievement_event');
   const row={event_id:event.id,game_id:event.game,correct_count:event.correct,occurred_at:new Date(event.at).toISOString()};
   const existing=unique.get(row.event_id);if(existing&&(existing.game_id!==row.game_id||existing.correct_count!==row.correct_count||existing.occurred_at!==row.occurred_at))throw conflict('event_id_conflict');
   unique.set(row.event_id,row);
  }
  const rows=[...unique.values()],now=new Date().toISOString();
  await this.insertAndVerify(account,'events',rows,['game_id','correct_count']);
  const merged=await this.database.prepare('INSERT INTO pin_sync_baselines(account,baseline_total,updated_at) VALUES(?,?,?) ON CONFLICT(account) DO UPDATE SET baseline_total=MAX(baseline_total,excluded.baseline_total),updated_at=excluded.updated_at RETURNING baseline_total').bind(account,baseline,now).first();
  const page=(await this.database.prepare('SELECT event_id,game_id,correct_count,occurred_at FROM pin_sync_events WHERE account=? AND event_id>? ORDER BY event_id LIMIT ?').bind(account,cursor??'',limit+1).all()).results;
  const shown=page.slice(0,limit);
  return {ok:true,sushi_id:account,achievements:{version:2,synced:true,accepted:rows.map(row=>row.event_id),events:shown.map(row=>({version:2,id:row.event_id,game:row.game_id,correct:row.correct_count,at:Date.parse(row.occurred_at)})),nextCursor:page.length>limit?shown.at(-1).event_id:null,baseline:merged.baseline_total}};
 }
 async outcomeSync(account,input={},now=Date.now()){
  if(!input||typeof input!=='object'||Array.isArray(input))throw invalid('invalid_outcome_page');
  const raw=input.events,offset=Number(input.offset??0);
  if(!Array.isArray(raw)||raw.length>200||!Number.isSafeInteger(offset)||offset<0||offset>1000000)throw invalid('invalid_outcome_page');
  const rows=[],ids=new Set();
  for(const event of raw){
   if(event?.version!==1||typeof event.id!=='string'||!EVENT_ID.test(event.id)||ids.has(event.id)||typeof event.game!=='string'||!GAME_ID.test(event.game)||typeof event.questionId!=='string'||!event.questionId||event.questionId.length>160||typeof event.correct!=='boolean'||typeof event.review!=='boolean'||!Number.isSafeInteger(event.at)||event.at<0||event.at>now+86400000)throw invalid('invalid_outcome_event');
   ids.add(event.id);const occurred=new Date(event.at).toISOString();
   rows.push({event_id:event.id,game_id:event.game,question_id:event.questionId,correct:Number(event.correct),review:Number(event.review),occurred_at:occurred,occurred_order:timestampOrder(occurred)});
  }
  await this.insertAndVerify(account,'outcomes',rows,['game_id','question_id','correct','review']);
  const page=(await this.database.prepare('SELECT event_id,game_id,question_id,correct,review,occurred_at FROM pin_sync_outcomes WHERE account=? ORDER BY occurred_order,event_id LIMIT 200 OFFSET ?').bind(account,offset).all()).results;
  return {ok:true,outcomes:{events:page.map(row=>({version:1,id:row.event_id,game:row.game_id,questionId:row.question_id,correct:Boolean(row.correct),review:Boolean(row.review),at:Date.parse(row.occurred_at)})),nextOffset:page.length===200?offset+200:null}};
 }
 async insertAndVerify(account,kind,rows,fields){
  if(!rows.length)return;
  if(kind!=='events'&&kind!=='outcomes')throw Error('invalid_event_table');
  const table='pin_sync_'+kind,document=JSON.stringify(rows),read=()=>this.database.prepare('SELECT * FROM '+table+" WHERE account=? AND event_id IN (SELECT json_extract(value,'$.event_id') FROM json_each(?))").bind(account,document).all();
  function verify(canonical,requireAll){
   const byId=new Map(canonical.map(row=>[row.event_id,row]));
   for(const row of rows){const existing=byId.get(row.event_id);if((!existing&&requireAll)||(existing&&(fields.some(field=>existing[field]!==row[field])||Date.parse(existing.occurred_at)!==Date.parse(row.occurred_at))))throw conflict(kind==='events'?'event_id_conflict':'outcome_id_conflict')}
  }
  verify((await read()).results,false);
  const columns=['event_id',...fields,'occurred_at',...(kind==='outcomes'?['occurred_order']:[])];
  await this.database.prepare('INSERT INTO '+table+'(account,'+columns.join(',')+',received_at) SELECT ?,'+columns.map(column=>"json_extract(value,'$."+column+"')").join(',')+',? FROM json_each(?) WHERE true ON CONFLICT(account,event_id) DO NOTHING').bind(account,new Date().toISOString(),document).run();
  verify((await read()).results,true);
 }
}
