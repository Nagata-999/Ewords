'use strict';
(()=>{
  if(window.__sushiDailyClickBridgeLoaded)return;
  window.__sushiDailyClickBridgeLoaded=true;

  const KEY='sushitan_login_bonus_v1';
  const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());
  const map={
    'sushitan.html':{key:'sushitan',goal:30,reward:5},
    'shinotan.html':{key:'shino',goal:20,reward:5},
    'antonitan.html':{key:'antoni',goal:20,reward:5}
  };
  const cfg=map[page];
  if(!cfg)return;

  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
  function write(l){localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'))}

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('.balloon[data-type="correct"]');
    if(!btn||btn.dataset.dailyQuestChecked==='1')return;
    btn.dataset.dailyQuestChecked='1';

    const l=read(),q=l.dailyQuests;
    if(!q||!Array.isArray(q.active)||!q.active.includes(cfg.key))return;
    q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};
    q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};
    if(q.claimed[cfg.key])return;

    q.progress[cfg.key]=Math.min(cfg.goal,(Number(q.progress[cfg.key])||0)+1);
    if(q.progress[cfg.key]>=cfg.goal){
      q.claimed[cfg.key]=true;
      l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+cfg.reward;
    }
    write(l);
  },true);
})();