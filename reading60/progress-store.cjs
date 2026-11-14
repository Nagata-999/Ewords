'use strict';
// Standalone Reading60 persistence helper; UI integration is pending.
// Does not access PIN sync, D1, ranking or network.
const KEY='sushitan-reading60-progress-v1',DAY=86400000;
const blank=()=>({version:1,updatedAt:null,history:[],items:{},queue:[],presentations:0});
function load(storage,ids){
 try{
  const raw=storage.getItem(KEY);if(raw===null)return {state:blank(),readOnly:false};
  const data=JSON.parse(raw);
  if(!data||data.version!==1||!Array.isArray(data.history)||!data.items||typeof data.items!=='object'||Array.isArray(data.items)||!Array.isArray(data.queue))throw Error('invalid schema');
  const state=blank();
  state.history=data.history.filter(h=>h&&ids.has(h.id)&&typeof h.correct==='boolean'&&typeof h.first==='boolean'&&Number.isFinite(h.seconds)&&h.seconds>=0&&h.seconds<=86400&&Number.isFinite(Date.parse(h.date))).slice(-10000);
  state.presentations=Number.isSafeInteger(data.presentations)&&data.presentations>=0?data.presentations:0;
  for(const [id,item] of Object.entries(data.items))if(ids.has(id)&&item&&Number.isFinite(Date.parse(item.nextReviewAt)))state.items[id]={attempts:Math.max(0,Number.isSafeInteger(item.attempts)?item.attempts:0),lapses:Math.max(0,Number.isSafeInteger(item.lapses)?item.lapses:0),streak:Math.max(0,Math.min(4,Number.isSafeInteger(item.streak)?item.streak:0)),lastAnsweredAt:item.lastAnsweredAt||null,nextReviewAt:item.nextReviewAt};
  const seen=new Set();
  state.queue=data.queue.filter(q=>q&&ids.has(q.id)&&!seen.has(q.id)&&Number.isSafeInteger(q.notBeforePresentation)&&q.notBeforePresentation>=0&&(seen.add(q.id),true)).map(q=>({id:q.id,notBeforePresentation:q.notBeforePresentation}));
  state.updatedAt=data.updatedAt||null;
  return {state,readOnly:false};
 }catch(e){return {state:blank(),readOnly:true,warning:'Existing Reading60 data was left untouched: '+e.message};}
}
function save(storage,state){try{const value=JSON.stringify(state);storage.setItem(KEY,value);return storage.getItem(KEY)===value}catch{return false}}
function record(state,id,correct,seconds,now=new Date()){
 if(!Number.isFinite(seconds)||seconds<0||seconds>86400)throw Error('invalid seconds');
 const first=!state.history.some(h=>h.id===id),old=state.items[id]||{attempts:0,lapses:0,streak:0};
 const streak=correct?Math.min(4,old.streak+1):0,days=correct?[1,3,7,14][Math.max(0,streak-1)]:1;
 state.items[id]={attempts:old.attempts+1,lapses:old.lapses+Number(!correct),streak,lastAnsweredAt:now.toISOString(),nextReviewAt:new Date(now.getTime()+days*DAY).toISOString()};
 state.history.push({id,correct,first,seconds,date:now.toISOString()});
 state.queue=state.queue.filter(q=>q.id!==id);
 if(!correct)state.queue.push({id,notBeforePresentation:state.presentations+6});
 state.updatedAt=now.toISOString();
}
function due(state,now=new Date()){
 const queued=state.queue.find(q=>q.notBeforePresentation<=state.presentations);
 if(queued)return queued.id;
 const pending=new Set(state.queue.map(q=>q.id));
 let oldestId=null,oldestAt=Infinity;
 for(const [id,item] of Object.entries(state.items)){
  const at=Date.parse(item.nextReviewAt);
  if(!pending.has(id)&&Number.isFinite(at)&&at<=now.getTime()&&at<oldestAt){oldestId=id;oldestAt=at;}
 }
 return oldestId;
}
function statistics(state){
 const initial=state.history.filter(h=>h.first===true);
 const review=state.history.filter(h=>h.first===false);
 const summarize=rows=>({
  attempts:rows.length,
  correct:rows.filter(h=>h.correct===true).length,
  accuracy:rows.length?rows.filter(h=>h.correct===true).length/rows.length:null,
  averageSeconds:rows.length?rows.reduce((sum,h)=>sum+h.seconds,0)/rows.length:null
 });
 return {initial:summarize(initial),review:summarize(review),total:summarize(state.history)};
}
module.exports={KEY,blank,load,save,record,due,statistics};
