'use strict';
/* Shared pure reward eligibility rules. No gems are credited in this module.
 * The authenticated server must verify authoritative metrics and atomically
 * record claim + gem credit before acknowledging a reward. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementRewards=api;
})(typeof window==='undefined'?null:window,function(){
 const STAGE_ID=/^achievement:([a-z0-9_]+):([1-9][0-9]*)$/;
 function stageFor(id,definitions){
   if(typeof id!=='string'||id.length>120)return null;
   const match=STAGE_ID.exec(id);if(!match)return null;
   const def=definitions.find(d=>d.id===match[1]);
   if(!def)return null;
   const stages=def.stages||[{threshold:def.threshold,points:def.points,gems:def.gems}];
   const stage=stages.find(s=>String(s.threshold)===match[2]);
   if(!stage||!Number.isSafeInteger(stage.gems)||stage.gems<0||stage.gems>10000)return null;
   return {id,definition:def,stage};
 }
 function eligibility(stageId,metrics,definitions,claimed=[]){
   if(!Array.isArray(definitions)||!metrics||typeof metrics!=='object')return {eligible:false,reason:'invalid_input'};
   const match=stageFor(stageId,definitions);
   if(!match)return {eligible:false,reason:'unknown_stage'};
   // Never trust inherited properties (e.g. prototype pollution) as metrics.
   if(!Object.prototype.hasOwnProperty.call(metrics,match.definition.metric))return {eligible:false,reason:'not_reached'};
   const value=metrics[match.definition.metric];
   if(!Number.isSafeInteger(value)||value<match.stage.threshold)return {eligible:false,reason:'not_reached'};
   if(Array.isArray(claimed)&&claimed.includes(stageId))return {eligible:false,reason:'already_claimed'};
   return {eligible:true,id:stageId,gems:match.stage.gems,points:match.stage.points||0};
 }
 function available(metrics,definitions,claimed=[]){
   if(!Array.isArray(definitions))return [];
   const out=[];
   for(const d of definitions){
     const stages=d.stages||[{threshold:d.threshold,points:d.points,gems:d.gems}];
     for(const s of stages){
       const result=eligibility('achievement:'+d.id+':'+s.threshold,metrics,definitions,claimed);
       if(result.eligible)out.push(result);
     }
   }
   return out;
 }
 return Object.freeze({stageFor,eligibility,available});
});
