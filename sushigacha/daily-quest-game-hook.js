'use strict';
(()=>{
  if(window.SushiDailyGame)return;
  const KEY='sushitan_login_bonus_v1',ACTIVE_KEY='sushitan_daily_active_v1';
  const GOALS={cross:20,blast:5};
  const day=()=>{const d=new Date();d.setHours(d.getHours()-6);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
  function ensure(l){
    const t=day();let active=null;
    try{const a=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');if(a&&a.day===t&&Array.isArray(a.active))active=a.active}catch{}
    if(l.dailyQuests?.day!==t){
      if(!active)return null;
      l.dailyQuests={day:t,active:[...active],progress:{},claimed:{},chestClaimed:false,chestReward:0};
    }
    const q=l.dailyQuests;
    if(!Array.isArray(q.active)&&active)q.active=[...active];
    q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};
    q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};
    return q;
  }
  function add(type,n=1){
    const goal=GOALS[type];if(!goal)return false;
    const l=read(),q=ensure(l);
    if(!q||!q.active.includes(type)||q.claimed[type])return false;
    q.progress[type]=Math.min(goal,Math.max(0,Number(q.progress[type])||0)+Math.max(0,Number(n)||0));
    let justClaimed=false;
    if(q.progress[type]>=goal&&!q.claimed[type]){
      q.claimed[type]=true;justClaimed=true;
    }
    localStorage.setItem(KEY,JSON.stringify(l));
    if(justClaimed){const awardId=`daily:${q.day}:${type}`;if(window.SushiGem?.awardGems)window.SushiGem.awardGems('daily-quest',10,awardId);else{const latest=read();latest.gems=(Number.isSafeInteger(latest.gems)?latest.gems:0)+10;localStorage.setItem(KEY,JSON.stringify(latest));}}
    window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'));
    return true;
  }
  window.SushiDailyGame={add};
})();