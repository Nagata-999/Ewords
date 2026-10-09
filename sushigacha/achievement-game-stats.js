'use strict';
/* Idempotent, device-local gameplay counters. No gems are awarded here.
 * A future PIN-sync backend must validate before permitting reward claims. */
(function(root){
 if(root.SushiAchievementGameStats)return;
 const KEY='sushitan_achievement_game_stats_v1';
 const read=()=>{try{const o=JSON.parse(localStorage.getItem(KEY)||'{}');return o&&typeof o==='object'?o:{}}catch{return{}}};
 function record(game,id,values={}){
   if(!['giri','blast'].includes(game)||typeof id!=='string'||!/^[a-zA-Z0-9:_-]{1,150}$/.test(id))return false;
   const data=read(),seen=data.seen&&typeof data.seen==='object'?data.seen:{};
   if(seen[id])return false;
   seen[id]=1;data.seen=seen;
   const safe=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,100000000):0;
   if(game==='giri'){
     data.giri_plays=safe(data.giri_plays)+1;
     data.giri_high_score=Math.max(safe(data.giri_high_score),safe(values.score));
   }else{
     data.blast_plays=safe(data.blast_plays)+1;
     data.blast_perfect=safe(data.blast_perfect)+safe(values.perfect);
   }
   localStorage.setItem(KEY,JSON.stringify(data));
   root.dispatchEvent(new CustomEvent('sushi-achievement-change',{detail:{game,stat:true}}));
   return true;
 }
 root.SushiAchievementGameStats=Object.freeze({record,read});
})(window);
