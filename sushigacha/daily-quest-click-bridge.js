'use strict';
(()=>{
  if(window.__sushiDailyClickBridgeLoaded)return;
  window.__sushiDailyClickBridgeLoaded=true;

  const KEY='sushitan_login_bonus_v1';
  const ACTIVE_KEY='sushitan_daily_active_v1';
  const ALL=['sushitan','shino','antoni','idiom','quiz','talk','world','run'];
  const CONFIG={
    sushitan:{label:'すし単',goal:30,reward:10,unit:'問'},
    shino:{label:'しの単',goal:20,reward:10,unit:'問'},
    antoni:{label:'あんとに単',goal:20,reward:10,unit:'問'},
    idiom:{label:'すしイディオム',goal:10,reward:10,unit:'問'},
    quiz:{label:'すしクイズ',goal:10,reward:10,unit:'問'},
    talk:{label:'すしTalk',goal:10,reward:10,unit:'問'},
    world:{label:'す界し',goal:5,reward:10,unit:'問'},
    run:{label:'すしRUN',goal:1500,reward:10,unit:'m'}
  };

  const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());
  const map={
    'sushitan.html':'sushitan','antonitan.html':'antoni','sushi_idiom (1).html':'idiom','sushi_idiom.html':'idiom','sushi_quiz.html':'quiz','sushitalk.html':'talk','sukaishi_world_study_v03.html':'world','sukaishi.html':'world','sushi_run.html':'run'
  };
  const key=map[page];if(!key)return;
  function day(){const d=new Date();d.setHours(d.getHours()-6);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function pick(date){let seed=hash('sushitan-daily-'+date),a=[...ALL];for(let i=a.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,4)}
  function activeFor(today){try{const s=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');if(s&&s.day===today&&Array.isArray(s.active)&&s.active.length===4)return s.active}catch(e){}const active=pick(today);localStorage.setItem(ACTIVE_KEY,JSON.stringify({day:today,active}));return active}
  function toast(text){let x=document.getElementById('sushiDailyProgressToast');if(!x){x=document.createElement('div');x.id='sushiDailyProgressToast';x.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:100010;background:#173f37;color:#fff;padding:10px 16px;border-radius:999px;font:900 12px/1.2 system-ui;box-shadow:0 8px 24px #0004;pointer-events:none;white-space:nowrap;transition:.18s;';document.body.appendChild(x)}x.textContent=text;x.style.opacity='1';x.style.transform='translateX(-50%) translateY(0)';clearTimeout(x._t);x._t=setTimeout(()=>{x.style.opacity='0';x.style.transform='translateX(-50%) translateY(10px)'},1400)}
  function add(n=1,{silent=false}={}){const cfg=CONFIG[key];if(!cfg)return null;const today=day(),active=activeFor(today);if(!active.includes(key))return null;let l={};try{l=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){}let q=l.dailyQuests;if(!q||q.day!==today){q=l.dailyQuests={day:today,active:[...active],progress:{},claimed:{},chestClaimed:false,chestReward:0}}else q.active=[...active];q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};if(q.claimed[key])return {progress:cfg.goal,goal:cfg.goal,claimed:true};const before=Math.max(0,Number(q.progress[key])||0),after=Math.min(cfg.goal,before+Math.max(0,Number(n)||0));if(after<=before)return {progress:before,goal:cfg.goal,claimed:false};q.progress[key]=after;let justClaimed=false;if(after>=cfg.goal&&!q.claimed[key]){q.claimed[key]=true;l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+cfg.reward;justClaimed=true}localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'));if(!silent){if(justClaimed)toast(`✅ デイリー ${cfg.label} ${after}/${cfg.goal}${cfg.unit}  +${cfg.reward}💎`);else toast(`デイリー ${cfg.label} ${after}/${cfg.goal}${cfg.unit}`)}return {progress:after,goal:cfg.goal,claimed:!!q.claimed[key]}}
  if(key==='sushitan'||key==='antoni'){const hit=e=>{const b=e.target.closest?.('.balloon[data-type="correct"]');if(!b||b.dataset.dailyQuestChecked==='1')return;b.dataset.dailyQuestChecked='1';add()};document.addEventListener('pointerdown',hit,true);document.addEventListener('click',hit,true);return}
  if(key==='quiz'){let last='';const check=()=>{const el=document.getElementById('soloRes');if(!el)return;const t=(el.textContent||'').trim();if(!t||t===last)return;last=t;if(/^✅\s*Correct!/i.test(t))add()};new MutationObserver(check).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true});check();return}
  if(key==='talk'){document.addEventListener('click',e=>{const b=e.target.closest?.('.choice');if(!b||b.dataset.dailyQuestChecked==='1')return;setTimeout(()=>{const el=document.querySelector('#feedback .delta');if(!el)return;const n=Number((el.textContent||'').replace(/[^+\-\d.]/g,''));if(n>0){b.dataset.dailyQuestChecked='1';add()}},50)},true);return}
  // The game reveals the correct choice after wrong answers too; CSS is not an answer result.
  if(key==='idiom'){window.addEventListener('sushi-idiom-correct',()=>add());return}
  if(key==='world'){let was=false;const check=()=>{const el=document.getElementById('judge');if(!el)return;const now=/✓\s*CORRECT|\bCORRECT\b/i.test(el.textContent||'');if(now&&!was)add();was=now};new MutationObserver(check).observe(document.documentElement,{subtree:true,childList:true,characterData:true});check();return}
  if(key==='run'){let last=0,pending=0,timer=null,lastToastBucket=-1;const flush=()=>{timer=null;if(pending<=0)return;const n=pending;pending=0;const res=add(n,{silent:true});if(!res)return;const bucket=Math.floor(res.progress/100);if(bucket!==lastToastBucket||res.claimed){lastToastBucket=bucket;const cfg=CONFIG.run;toast(res.claimed?`✅ デイリー ${cfg.label} ${res.progress}/${cfg.goal}m  +${cfg.reward}💎`:`デイリー ${cfg.label} ${res.progress}/${cfg.goal}m`)}};const check=()=>{const el=document.getElementById('distance');if(!el)return;const current=Math.max(0,Number((el.textContent||'').replace(/[^\d.]/g,''))||0);if(current<last){last=current;return}const delta=current-last;last=current;if(delta>0){pending+=delta;if(!timer)timer=setTimeout(flush,500)}};const start=()=>{const el=document.getElementById('distance');if(!el){setTimeout(start,250);return}new MutationObserver(check).observe(el,{childList:true,subtree:true,characterData:true});check()};start()}
})();