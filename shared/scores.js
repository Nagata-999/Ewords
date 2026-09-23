(function(){
'use strict';
if(window.SushiScores)return;
const TARGETS={main:{url:'https://rxyoyveykxdfrpomkltl.supabase.co',key:'sb_publishable_RmWOSxRfsV5YRwCDnKPPAQ_m3VzsUM7'},typing:{url:'https://ykrjocftuflnkubaxrza.supabase.co',key:'sb_publishable_R3ff2RuU9WOU8pbj5SxvLg_R8ZW6EhP'}};
const PREFIX='sushitan_pending_score_v1:',pending=new Map(),active=new Map(),statuses=new Map();
let retryTimer;
const day=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
const id=()=>{try{return crypto.randomUUID()}catch(_){return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}};
function remember(job){pending.set(job.id,job);try{localStorage.setItem(PREFIX+job.id,JSON.stringify(job));return true}catch(_){return false}}
function forget(job){pending.delete(job.id);try{localStorage.removeItem(PREFIX+job.id)}catch(_){}}
function restore(){try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith(PREFIX))continue;try{const j=JSON.parse(localStorage.getItem(key));if(j?.id&&TARGETS[j.target]&&j.params?.p_mode&&Number.isInteger(j.params.p_score))pending.set(j.id,j)}catch(_){}}}catch(_){}}
function status(job,text){const el=statuses.get(job.id);if(el&&el.dataset.sushiScoreId===job.id)el.textContent=text}
function schedule(){clearTimeout(retryTimer);if(pending.size)retryTimer=setTimeout(flush,30000)}
async function send(job){
 if(active.has(job.id))return active.get(job.id);
 const promise=(async()=>{
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
   const target=TARGETS[job.target];
   // A delayed record must not be counted as today's record on another day.
   const rpc=job.daily&&job.day===day()?'save_score_with_daily':'save_high_score';
   const response=await fetch(target.url+'/rest/v1/rpc/'+rpc,{method:'POST',headers:{apikey:target.key,'Content-Type':'application/json'},body:JSON.stringify(job.params),signal:controller.signal,keepalive:true});
   if(!response.ok)throw new Error('score save failed');
   forget(job);status(job,job.params.p_player_name+' の記録を自動保存しました。');statuses.delete(job.id);
   window.dispatchEvent(new CustomEvent('sushi-score-saved',{detail:{mode:job.params.p_mode,target:job.target}}));
   return {saved:true,queued:false};
  }catch(_){
   const durable=remember(job);status(job,durable?'端末に記録しました。通信が戻ると自動でランキングに送信します。':'送信待ちです。この画面を開いたまま通信を確認してください。');schedule();return {saved:false,queued:true};
  }finally{clearTimeout(timeout);active.delete(job.id)}
 })();active.set(job.id,promise);return promise;
}
function save(params,options={}){
 const target=options.target||'main',name=window.SushiPlayer.getName();
 if(!TARGETS[target])return Promise.reject(new Error('Unknown score target'));
 const clean={p_player_name:name,p_score:Math.max(0,Math.min(2147483647,Math.round(Number(params.p_score)||0))),p_max_combo:Math.max(0,Math.min(2147483647,Math.round(Number(params.p_max_combo)||0))),p_accuracy:Math.max(0,Math.min(100,Math.round(Number(params.p_accuracy)||0))),p_mode:String(params.p_mode||'')};
 if(!clean.p_mode)return Promise.reject(new Error('Missing score mode'));
 const job={id:options.id||id(),target,params:clean,daily:!!options.daily,day:day()};
 const el=options.status;
 if(el){el.dataset.sushiScoreId=job.id;statuses.set(job.id,el);status(job,'ランキングに自動保存中…')}
 remember(job);return send(job);
}
async function flush(){restore();for(const job of [...pending.values()])await send(job);schedule()}
window.SushiScores={save,flush,id};
window.addEventListener('online',flush);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',flush);else flush();
})();
