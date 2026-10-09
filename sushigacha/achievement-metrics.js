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
 function compute({historicalTotal=0,ledgerTotal=0,byGame={},loginStreak=0,dailyClaims=0,gemsEarned=0,avatarItems=0,gemPurchases=0,outfitChanges=0,gameStats={}}={}){
   const games=byGame&&typeof byGame==='object'?byGame:{};
   let vocabulary=0;
   for(const [id,n] of Object.entries(games))if(VOCABULARY.has(id))vocabulary+=safeCount(n);
   return {correct_total:Math.max(safeCount(historicalTotal),safeCount(ledgerTotal)),
     correct_vocabulary:vocabulary,toeic_correct:safeCount(games.toeic),login_streak:safeCount(loginStreak),
     daily_claims:safeCount(dailyClaims),gems_earned:safeCount(gemsEarned),avatar_items:safeCount(avatarItems),
     gem_purchases:safeCount(gemPurchases),outfit_changes:safeCount(outfitChanges),
     giri_high_score:safeCount(gameStats.giri_high_score),blast_high_score:safeCount(gameStats.blast_high_score)};
 }
 return Object.freeze({compute});
});
