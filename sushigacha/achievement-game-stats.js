'use strict';
/* Only unlocked achievement IDs are stored, never play counts or scores. */
(function(root){
 const KEY='sushitan_achievement_unlocks_v1';
 const LEDGER='sushitan_login_bonus_v1';
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
   return merge(RULES[game].filter(n=>score>=n).map(n=>'achievement:'+game+':'+n));
 }
 function read(){
   const ids=new Set(unlocked());
   const max=game=>Math.max(0,...RULES[game].filter(n=>ids.has('achievement:'+game+':'+n)));
   return {giri_high_score:max('giri'),blast_high_score:max('blast')};
 }
 root.SushiAchievementGameStats=Object.freeze({record,read,unlocked,merge});
 try{const ledger=JSON.parse(localStorage.getItem(LEDGER)||'{}');merge(ledger.achievementUnlocks)}catch{}
})(window);
