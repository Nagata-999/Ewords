'use strict';
/* Detect newly reached milestones without triggering for existing history.
 * Presentation layer handles animation; no gem side effects. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementMilestones=api;
})(typeof window==='undefined'?null:window,function(){
 function reachedBetween(previous,current,definitions){
   if(!previous||!current||!Array.isArray(definitions))return [];
   const result=[];
   for(const def of definitions){
     const old=previous[def.metric],now=current[def.metric];
     if(!Number.isSafeInteger(old)||old<0||!Number.isSafeInteger(now)||now<old)continue;
     const stages=def.stages||[{threshold:def.threshold,points:def.points,gems:def.gems}];
     for(const stage of stages){
       if(!Number.isSafeInteger(stage.threshold)||stage.threshold<1)continue;
       if(old<stage.threshold&&now>=stage.threshold){
         result.push({id:'achievement:'+def.id+':'+stage.threshold,title:def.title,
           threshold:stage.threshold,gems:stage.gems||0,color:stage.color||'white'});
       }
     }
   }
   return result;
 }
 return Object.freeze({reachedBetween});
});
