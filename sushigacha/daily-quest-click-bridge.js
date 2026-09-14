'use strict';
(()=>{
  if(window.__sushiDailyClickBridgeLoaded)return;
  window.__sushiDailyClickBridgeLoaded=true;

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

  function api(fn){
    const q=window.SushiDailyQuest;
    if(!q||typeof q[fn]!=='function')return false;
    return q;
  }
  function add(n=1){const q=api('add');if(q)q.add(key,n)}

  if(key==='sushitan'||key==='antoni'){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.balloon[data-type="correct"]');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      b.dataset.dailyQuestChecked='1';
      add();
    },true);
    return;
  }

  if(key==='quiz'){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('#soloChoices .choice');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      setTimeout(()=>{
        if(b.dataset.dailyQuestChecked==='1')return;
        if(b.classList.contains('correct')){
          b.dataset.dailyQuestChecked='1';
          add();
        }
      },0);
    },true);
    return;
  }

  if(key==='idiom'){
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

  if(key==='talk'){
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('.choice');
      if(!b||b.dataset.dailyQuestChecked==='1')return;
      setTimeout(()=>{
        if(b.dataset.dailyQuestChecked==='1')return;
        const el=document.querySelector('#feedback .delta');
        if(!el)return;
        const n=Number((el.textContent||'').replace(/[^+\-\d.]/g,''));
        if(n>0){b.dataset.dailyQuestChecked='1';add()}
      },0);
    },true);
    return;
  }

  if(key==='world'){
    let was=false;
    const check=()=>{
      const el=document.getElementById('judge');
      if(!el)return;
      const now=/✓\s*CORRECT|CORRECT/i.test(el.textContent||'');
      if(now&&!was)add();
      was=now;
    };
    new MutationObserver(check).observe(document.documentElement,{subtree:true,childList:true,characterData:true});
    check();
    return;
  }

  if(key==='run'){
    let last=0,pending=0,timer=null;
    const flush=()=>{
      timer=null;
      if(pending<=0)return;
      const n=pending;
      pending=0;
      add(n);
    };
    const check=()=>{
      const el=document.getElementById('distance');
      if(!el)return;
      const current=Math.max(0,Number((el.textContent||'').replace(/[^\d.]/g,''))||0);
      if(current<last){last=current;return}
      const delta=current-last;
      last=current;
      if(delta<=0)return;
      pending+=delta;
      if(!timer)timer=setTimeout(flush,500);
    };
    const start=()=>{
      const el=document.getElementById('distance');
      if(!el){setTimeout(start,250);return}
      new MutationObserver(check).observe(el,{childList:true,subtree:true,characterData:true});
      check();
    };
    start();
  }
})();
