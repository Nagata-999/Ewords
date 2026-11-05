(function(){
'use strict';
const credentials=new Map(),snapshots=new Map(),inflight=new Map(),playerRooms=new Map();
const activity=new Map(),failures=new Map();
function note(code,data){
 activity.set(code,{session:data.session});
 failures.delete(code);
}
function pollDelay(code){
 const failed=failures.get(code);
 if(failed){if([403,404].includes(failed.error.status))return null;return Math.max(2000,failed.retryAt-Date.now());}
 const a=activity.get(code),s=a?.session;
 if(!s)return 3000;
 const result=['result','buzzer_result'].includes(s.status);
 if(result&&s.q_index>=s.length-1)return null;
 if(s.status==='buzzer_question')return 1000;
 if(s.status==='question')return 2000;
 return result?3000:5000;
}
function get(code){if(credentials.has(code))return credentials.get(code);let v={};try{v=JSON.parse(sessionStorage.getItem('quiz-d1:'+code)||'{}')}catch{}credentials.set(code,v);return v}
function remember(code,v){credentials.set(code,v);try{sessionStorage.setItem('quiz-d1:'+code,JSON.stringify(v))}catch{}}
async function request(path,body,key){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch(path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(key?{'X-Quiz-Token':key}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
 const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.message||'通信に失敗しました。'),{status:response.status});return data;
 }finally{clearTimeout(timeout)}
}
async function state(code){
 const cached=snapshots.get(code);
 // Only the host can advance a result; joining/answering is closed in this phase.
 if(cached&&(Date.now()-cached.at<700||(get(code).host&&['result','buzzer_result'].includes(cached.data.session.status))))return cached.data;
 if(inflight.has(code))return inflight.get(code);
 const failed=failures.get(code);if(failed&&Date.now()<failed.retryAt)throw failed.error;
 const c=get(code),job=request('/api/quiz/rooms/'+encodeURIComponent(code),null,c.host||c.player).then(data=>{for(const p of data.players)playerRooms.set(p.id,code);snapshots.set(code,{at:Date.now(),data});note(code,data);return data}).catch(error=>{const count=(failures.get(code)?.count||0)+1;failures.set(code,{error,count,retryAt:Date.now()+Math.min(60000,(error.status===429?15000:3000)*2**Math.min(count-1,5))});throw error}).finally(()=>inflight.delete(code));inflight.set(code,job);return job;
}
class Query{
 constructor(table){this.table=table;this.action='select';this.filters={};this.params=new URLSearchParams()}
 select(columns='*'){this.params.set('select',columns);return this}
 insert(value){this.action='insert';this.value=value;return this}
 update(value){this.action='update';this.value=value;return this}
 eq(k,v){this.filters[k]=String(v);this.params.set(k,'eq.'+v);return this}
 order(k,opts={}){this.params.set('order',k+(opts.ascending===false?'.desc':'.asc'));return this}
 limit(n){this.params.set('limit',n);return this}
 maybeSingle(){this.single=true;return this}
 then(resolve,reject){if(!this.job)this.job=this.run();return this.job.then(resolve,reject)}
 async run(){try{
  if(this.table==='scores'){if(this.action!=='select')throw Error('Unsupported ranking operation');return {data:await request('/api/rankings/main/rest/v1/scores?'+this.params),error:null}}
  const sessions=this.table==='sushi_quiz_sessions';if(!sessions&&this.table!=='sushi_quiz_players')throw Error('Unsupported table');
  let code=this.filters.code||this.filters.session_code||this.value?.session_code||this.value?.code||playerRooms.get(this.filters.id);
  if(!code)throw Error('部屋番号がありません。');
  const cred=get(code);let data;
  if(this.action==='select'){
   const snapshot=await state(code);data=sessions?[snapshot.session]:snapshot.players;
  }else{
   const action=this.action==='insert'?(sessions?'create':'join'):(sessions?'session':this.filters.session_code?'reset':'player');
   const key=action==='player'&&this.value?.score===undefined&&cred.player?cred.player:cred.host||cred.player;
   const result=await request('/api/quiz/rooms'+(action==='create'?'':'/'+encodeURIComponent(code)),{action,value:this.value,id:this.filters.id},key);
   if(action==='create')remember(code,{...cred,host:result.token});
   if(action==='join'){remember(code,{...cred,player:result.token,playerId:result.data.id});playerRooms.set(result.data.id,code)}
   snapshots.delete(code);failures.delete(code);activity.delete(code);data=result.data?[result.data]:[];
  }
  return {data:this.single?(data[0]||null):data,error:null};
 }catch(error){return {data:null,error:{message:error.message||'通信に失敗しました。',status:error.status||0}}}}
}
window.SushiQuizD1={from:table=>new Query(table),pollDelay,isHost:code=>!!get(code).host,invalidate:code=>snapshots.delete(code),async scorePlayers(code,players,q_index){try{const result=await request('/api/quiz/rooms/'+code,{action:'scores',value:{players,q_index}},get(code).host);snapshots.delete(code);failures.delete(code);activity.delete(code);return {...result,error:null}}catch(error){return {data:null,error:{message:error.message}}}}};
})();
