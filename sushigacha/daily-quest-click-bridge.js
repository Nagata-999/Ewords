'use strict';
(()=>{
  if(window.__sushiDailyClickBridgeLoaded)return;
  window.__sushiDailyClickBridgeLoaded=true;

  const KEY='sushitan_login_bonus_v1';
  const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());
  const map={
    'sushitan.html':{key:'sushitan',goal:30,reward:5},
    'shinotan.html':{key:'shino',goal:20,reward:5},
    'antonitan.html':{key:'antoni',goal:20,reward:5},
    'sushi_idiom (1).html':{key:'idiom',goal:10,reward:4},
    'sushi_idiom.html':{key:'idiom',goal:10,reward:4},
    'sushi_quiz.html':{key:'quiz',goal:10,reward:4},
    'sushitalk.html':{key:'talk',goal:10,reward:3},
    'sukaishi_world_study_v03.html':{key:'world',goal:5,reward:3},
    'sukaishi.html':{key:'world',goal:5,reward:3}
  };
  const cfg=map[page];
  if(!cfg)return;

  function day(){const d=new Date();d.setHours(d.getHours()-6);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
  function write(l){localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'))}
  function toast(text){
    let t=document.getElementById('sushiDirectDailyToast');
    if(!t){t=document.createElement('div');t.id='sushiDirectDailyToast';t.style.cssText='position:fixed;left:50%;bottom:80px;transform:translateX(-50%);z-index:100002;background:#173f37;color:#fff;padding:9px 14px;border-radius:999px;font:900 12px/1.2 system-ui;box-shadow:0 8px 24px #0004;pointer-events:none;transition:.2s';document.body.appendChild(t)}
    t.textContent=text;t.style.opacity='1';clearTimeout(t._timer);t._timer=setTimeout(()=>t.style.opacity='0',1200);
  }
  function add(){
    const l=read(),q=l.dailyQuests;
    if(!q||q.day!==day()||!Array.isArray(q.active)||!q.active.includes(cfg.key))return;
    q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};
    q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};
    if(q.claimed[cfg.key])return;
    q.progress[cfg.key]=Math.min(cfg.goal,(Number(q.progress[cfg.key])||0)+1);
    if(q.progress[cfg.key]>=cfg.goal){q.claimed[cfg.key]=true;l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+cfg.reward}
    write(l);toast(`デイリー ${q.progress[cfg.key]}/${cfg.goal}`);
  }

  if(['sushitan','shino','antoni'].includes(cfg.key)){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.balloon[data-type="correct"]');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      b.dataset.dailyQuestChecked='1';add();
    },true);
    return;
  }

  if(cfg.key==='idiom'||cfg.key==='quiz'){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.choice,button');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      setTimeout(()=>{
        if(b.dataset.dailyQuestChecked==='1')return;
        const ok=b.classList.contains('good')||b.classList.contains('correct')||b.classList.contains('correct-flash')||b.getAttribute('data-correct')==='true';
        if(ok){b.dataset.dailyQuestChecked='1';add()}
      },100);
    },true);
    return;
  }

  if(cfg.key==='talk'){
    const seen=new WeakSet();
    const scan=()=>document.querySelectorAll('.delta').forEach(el=>{
      if(seen.has(el))return;
      const n=Number((el.textContent||'').replace(/[^+\-\d.]/g,''));
      if(n>0){seen.add(el);add()}
    });
    new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,characterData:true});scan();
    return;
  }

  if(cfg.key==='world'){
    let was=false;
    const check=()=>{
      const el=document.getElementById('judge');if(!el)return;
      const now=/✓\s*CORRECT|CORRECT/i.test(el.textContent||'');
      if(now&&!was)add();was=now;
    };
    new MutationObserver(check).observe(document.documentElement,{subtree:true,childList:true,characterData:true});check();
  }
})();