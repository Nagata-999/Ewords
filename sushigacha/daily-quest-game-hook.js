'use strict';
(()=>{
  if(window.SushiDailyGame)return;
  const KEY='sushitan_login_bonus_v1';
  const GOALS={cross:20,blast:5};
  const LABELS={cross:'すしクロス',blast:'ブロックブラすし'};
  function add(type,n=1){
    const goal=GOALS[type];if(!goal)return;
    let l={};try{l=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return}
    const q=l.dailyQuests;if(!q||!Array.isArray(q.active)||!q.active.includes(type)||q.claimed?.[type])return;
    q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};
    q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};
    q.progress[type]=Math.min(goal,Math.max(0,Number(q.progress[type])||0)+Math.max(0,Number(n)||0));
    if(q.progress[type]>=goal&&!q.claimed[type]){
      q.claimed[type]=true;l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+10;
    }
    localStorage.setItem(KEY,JSON.stringify(l));
    window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'));
  }
  window.SushiDailyGame={add};
})();