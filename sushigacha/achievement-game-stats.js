'use strict';
/* Only unlocked achievement IDs are stored, never play counts or scores. */
(function(root){
 const KEY='sushitan_achievement_unlocks_v1';
 const LEDGER='sushitan_login_bonus_v1';
 const SCORES='sushitan_achievement_game_scores_v1';
 const RULES=Object.freeze({giri:[10000,30000,50000],blast:[1000,5000,10000,20000]});
 function unlocked(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a.filter(x=>typeof x==='string'&&/^achievement:(giri|blast):[0-9]+$/.test(x)):[]}catch{return[]}}
 function merge(ids){
   const before=unlocked(),all=new Set(before);
   for(const id of Array.isArray(ids)?ids:[])if(typeof id==='string'&&/^achievement:(giri|blast):[0-9]+$/.test(id))all.add(id);
   if(all.size===before.length)return false;
   localStorage.setItem(KEY,JSON.stringify([...all].sort()));
   try{const ledger=JSON.parse(localStorage.getItem(LEDGER)||'{}');ledger.achievementUnlocks=[...new Set([...(Array.isArray(ledger.achievementUnlocks)?ledger.achievementUnlocks:[]),...all])];localStorage.setItem(LEDGER,JSON.stringify(ledger))}catch{}
   root.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{unlocks:true}}));
   return true;
 }
 function record(game,_id,values={}){
   if(!Object.hasOwn(RULES,game))return false;
   const score=Math.max(0,Math.floor(Number(values.score)||0));
   if(!Number.isSafeInteger(score))return false;
   mergeScores({[game]:score});
   return merge(RULES[game].filter(n=>score>=n).map(n=>'achievement:'+game+':'+n));
 }
 function mergeScores(incoming={}){
   let scores={};try{scores=JSON.parse(localStorage.getItem(SCORES)||'{}')||{}}catch{}
   let changed=false;
   for(const game of Object.keys(RULES)){const n=incoming?.[game];if(Number.isSafeInteger(n)&&n>Math.max(0,Number(scores[game])||0)){scores[game]=n;changed=true}}
   if(changed){localStorage.setItem(SCORES,JSON.stringify(scores));const ledger=JSON.parse(localStorage.getItem(LEDGER)||'{}');ledger.achievementGameScores=scores;localStorage.setItem(LEDGER,JSON.stringify(ledger));root.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{scores:true}}))}
   return scores;
 }
 function read(){
   const ids=new Set(unlocked());
   let scores={};try{scores=JSON.parse(localStorage.getItem(SCORES)||'{}')||{}}catch{}
   const max=game=>Math.max(0,Number(scores[game])||0,...RULES[game].filter(n=>ids.has('achievement:'+game+':'+n)));
   return {giri_high_score:max('giri'),blast_high_score:max('blast')};
 }
 root.SushiAchievementGameStats=Object.freeze({record,read,unlocked,merge,mergeScores});
 try{const ledger=JSON.parse(localStorage.getItem(LEDGER)||'{}');merge(ledger.achievementUnlocks);mergeScores(ledger.achievementGameScores)}catch{}
})(window);
