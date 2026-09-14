'use strict';
(()=>{
  if(window.__sushiDailyClickBridgeLoaded)return;
  window.__sushiDailyClickBridgeLoaded=true;

  const KEY='sushitan_login_bonus_v1';
  const ACTIVE_KEY='sushitan_daily_active_v1';
  const CONFIG={
    sushitan:{goal:30,reward:5}, shino:{goal:20,reward:5}, antoni:{goal:20,reward:5},
    idiom:{goal:10,reward:4}, quiz:{goal:10,reward:4}, talk:{goal:10,reward:3},
    world:{goal:5,reward:3}, run:{goal:1500,reward:5}
  };
  const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());
  const map={
    'sushitan.html':'sushitan',
    'antonitan.html':'antoni',
    'sushi_idiom (1).html':'idiom',
    'sushi_idiom.html':'idiom',
    'sushi_quiz.html':'quiz',
    'sushitalk.html':'talk',
    'sukaishi_world_study_v03.html':'world',
    'sukaishi.html':'world',
    'sushi_run.html':'run'
  };
  const key=map[page];
  if(!key)return;

  function day(){
    const d=new Date(); d.setHours(d.getHours()-6);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function fallbackAdd(n=1){
    const cfg=CONFIG[key]; if(!cfg)return;
    const today=day();
    let l={}; try{l=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{}
    let active=[]; try{const a=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null'); if(a&&a.day===today&&Array.isArray(a.active))active=a.active}catch{}
    let q=l.dailyQuests;
    if(!q||q.day!==today){q=l.dailyQuests={day:today,active:[...active],progress:{},claimed:{},chestClaimed:false,chestReward:0}}
    if(!Array.isArray(q.active)||!q.active.includes(key))return;
    q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};
    q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};
    if(q.claimed[key])return;
    q.progress[key]=Math.min(cfg.goal,(Number(q.progress[key])||0)+Math.max(0,Number(n)||0));
    if(q.progress[key]>=cfg.goal){
      q.claimed[key]=true;
      l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+cfg.reward;
    }
    localStorage.setItem(KEY,JSON.stringify(l));
    window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'));
  }
  function add(n=1){
    const q=window.SushiDailyQuest;
    if(q&&typeof q.add==='function')q.add(key,n);
    else fallbackAdd(n);
  }

  if(key==='sushitan'||key==='antoni'){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.balloon[data-type="correct"]');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      b.dataset.dailyQuestChecked='1'; add();
    },true);
    return;
  }

  if(key==='quiz'){
    const hook=()=>{
      const el=document.getElementById('soloRes');
      if(!el)return false;
      let last='';
      const check=()=>{
        const t=(el.textContent||'').trim();
        if(t===last)return;
        last=t;
        if(/^✅\s*Correct!/i.test(t))add();
      };
      new MutationObserver(check).observe(el,{subtree:true,childList:true,characterData:true,attributes:true});
      check(); return true;
    };
    if(!hook())setTimeout(hook,300);
    return;
  }

  if(key==='talk'){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.choice');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      setTimeout(()=>{
        const el=document.querySelector('#feedback .delta'); if(!el)return;
        const n=Number((el.textContent||'').replace(/[^+\-\d.]/g,''));
        if(n>0){b.dataset.dailyQuestChecked='1';add()}
      },40);
    },true);
    return;
  }

  if(key==='idiom'){
    const seen=new WeakSet();
    const scan=()=>{
      document.querySelectorAll('.good,.correct,.correct-flash,[data-correct="true"]').forEach(el=>{
        if(seen.has(el))return;
        if(el.closest('button,.choice')||el.matches('button,.choice')){seen.add(el);add()}
      });
    };
    new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-correct']});
    scan(); return;
  }

  if(key==='world'){
    let was=false;
    const check=()=>{
      const el=document.getElementById('judge'); if(!el)return;
      const now=/✓\s*CORRECT|\bCORRECT\b/i.test(el.textContent||'');
      if(now&&!was)add(); was=now;
    };
    new MutationObserver(check).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    check(); return;
  }

  if(key==='run'){
    let last=0,pending=0,timer=null;
    const flush=()=>{timer=null;if(pending>0){const n=pending;pending=0;add(n)}};
    const check=()=>{
      const el=document.getElementById('distance'); if(!el)return;
      const current=Math.max(0,Number((el.textContent||'').replace(/[^\d.]/g,''))||0);
      if(current<last){last=current;return}
      const delta=current-last; last=current;
      if(delta>0){pending+=delta;if(!timer)timer=setTimeout(flush,350)}
    };
    const start=()=>{const el=document.getElementById('distance');if(!el){setTimeout(start,250);return}new MutationObserver(check).observe(el,{childList:true,subtree:true,characterData:true});check()};
    start();
  }
})();
