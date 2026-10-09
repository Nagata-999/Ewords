'use strict';
/* Attribution rules: historical totals without a game ID cannot safely unlock
 * game-specific achievements. Pure module for testable UI metrics. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SushiAchievementMetrics=api;
})(typeof window==='undefined'?null:window,function(){
 const VOCABULARY=new Set(['sushitan','shinotan','antonitan','idiom','sushi_idiom']);
 function safeCount(value){return Number.isSafeInteger(value)&&value>=0?value:0}
 function compute({historicalTotal=0,ledgerTotal=0,byGame={},loginStreak=0}={}){
   const games=byGame&&typeof byGame==='object'?byGame:{};
   let vocabulary=0;
   for(const [id,n] of Object.entries(games))if(VOCABULARY.has(id))vocabulary+=safeCount(n);
   return {correct_total:Math.max(safeCount(historicalTotal),safeCount(ledgerTotal)),
     correct_vocabulary:vocabulary,login_streak:safeCount(loginStreak)};
 }
 return Object.freeze({compute});
});
