'use strict';
/* Pure merge functions shared by future server/client tests. No network or gem mutations. */
(function(root){
  const safe=e=>e&&e.version===2&&typeof e.id==='string'&&/^[a-zA-Z0-9:_-]{1,159}$/.test(e.id)&&
    typeof e.game==='string'&&/^[a-z0-9_-]{1,40}$/.test(e.game)&&
    Number.isSafeInteger(e.correct)&&e.correct>0&&e.correct<=1000&&Number.isFinite(e.at)&&e.at>=0;
  function mergeEvents(server=[],client=[]){
    const byId=new Map(),conflicts=[];
    for(const source of [server,client]){
      if(!Array.isArray(source))continue;
      for(const event of source){
        if(!safe(event))continue;
        const old=byId.get(event.id);
        if(!old){byId.set(event.id,{version:2,id:event.id,game:event.game,correct:event.correct,at:event.at});continue}
        if(old.game!==event.game||old.correct!==event.correct)conflicts.push(event.id);
      }
    }
    return {events:[...byId.values()].sort((a,b)=>a.id.localeCompare(b.id)),conflicts:[...new Set(conflicts)]};
  }
  function totals(events){
    const byGame=Object.create(null);let total=0;
    for(const e of mergeEvents(events,[]).events){total+=e.correct;byGame[e.game]=(byGame[e.game]||0)+e.correct}
    return {total,byGame};
  }
  const api=Object.freeze({mergeEvents,totals});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.SushiAchievementMerge=api;
})(typeof window==='undefined'?null:window);
