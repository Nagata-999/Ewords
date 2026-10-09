'use strict';
/* Cosmetic titles only. Never grants gems or changes server-side progress. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementTitles=api;
})(typeof window==='undefined'?null:window,function(){
 const KEY='sushitan_achievement_title_v1';
 function unlocked(metrics,definitions){
   if(!metrics||!Array.isArray(definitions))return [];
   const result=[];
   for(const d of definitions){
     const value=Object.prototype.hasOwnProperty.call(metrics,d.metric)?metrics[d.metric]:0;
     if(!Number.isSafeInteger(value)||value<0)continue;
     const stages=d.stages||[{threshold:d.threshold,color:'white'}];
     for(const stage of stages){
       if(!Number.isSafeInteger(stage.threshold)||stage.threshold<1||value<stage.threshold)continue;
       result.push({id:'achievement:'+d.id+':'+stage.threshold,title:d.title,level:stage.color||'white',threshold:stage.threshold});
     }
   }
   return result;
 }
 function choose(id,metrics,definitions){
   if(typeof id!=='string'||id.length>120)return null;
   return unlocked(metrics,definitions).find(x=>x.id===id)||null;
 }
 function selection(storage,metrics,definitions){
   let selected=null;
   try{selected=storage?.getItem(KEY)}catch{}
   return choose(selected,metrics,definitions);
 }
 function set(storage,id,metrics,definitions){
   if(id===null||id===''){
     storage.removeItem(KEY);
     return true;
   }
   if(!choose(id,metrics,definitions))return false;
   storage.setItem(KEY,id);
   return true;
 }
 return Object.freeze({KEY,unlocked,choose,selection,set});
});
