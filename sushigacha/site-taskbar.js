'use strict';
(()=>{
  if(window.__sushiSiteTaskbarLoaded)return;
  window.__sushiSiteTaskbarLoaded=true;

  const KEY='sushitan_login_bonus_v1';
  const ACTIVE_KEY='sushitan_daily_active_v1';
  const QUESTS={
    sushitan:{label:'すし単',icon:'🍣',goal:30,reward:5,unit:'問'},
    shino:{label:'しの単',icon:'🟣',goal:20,reward:5,unit:'問'},
    antoni:{label:'あんとに単',icon:'🔴',goal:20,reward:5,unit:'問'},
    idiom:{label:'すしイディオム',icon:'🍱',goal:10,reward:4,unit:'問'},
    quiz:{label:'すしクイズ',icon:'❓',goal:10,reward:4,unit:'問'},
    talk:{label:'すしTalk',icon:'💬',goal:10,reward:3,unit:'問'},
    world:{label:'す界し',icon:'🌍',goal:5,reward:3,unit:'問'},
    run:{label:'すしRUN',icon:'🏃',goal:1500,reward:5,unit:'m'}
  };
  const QUEST_KEYS=Object.keys(QUESTS),DAILY_COUNT=4;

  const day=()=>{
    const d=new Date();
    d.setHours(d.getHours()-6);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function dailyPick(date){
    let seed=hash('sushitan-daily-'+date),arr=[...QUEST_KEYS];
    for(let i=arr.length-1;i>0;i--){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const j=seed%(i+1);
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr.slice(0,DAILY_COUNT);
  }
  function validActive(a){return Array.isArray(a)&&a.length===DAILY_COUNT&&new Set(a).size===DAILY_COUNT&&a.every(k=>QUESTS[k])}
  function readActive(){try{return JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null')}catch{return null}}
  function writeActive(date,active){localStorage.setItem(ACTIVE_KEY,JSON.stringify({day:date,active:[...active]}))}
  function frozenActive(date,existing){
    const saved=readActive();
    if(saved&&saved.day===date&&validActive(saved.active))return [...saved.active];
    if(validActive(existing)){
      writeActive(date,existing);
      return [...existing];
    }
    const picked=dailyPick(date);
    writeActive(date,picked);
    return picked;
  }
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}}
  function ensure(l){
    const today=day();
    const sameDay=l.dailyQuests&&l.dailyQuests.day===today;
    const previousActive=sameDay?l.dailyQuests.active:null;
    const active=frozenActive(today,previousActive);
    if(!sameDay)l.dailyQuests={day:today,active,progress:{},claimed:{},chestClaimed:false,chestReward:0};
    const q=l.dailyQuests;
    q.active=active;
    q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};
    q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};
    for(const k of QUEST_KEYS){
      q.progress[k]=Math.max(0,Number(q.progress[k])||0);
      q.claimed[k]=!!q.claimed[k];
    }
    return q;
  }
  function write(l){localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'))}
  function toast(text){
    let t=document.getElementById('sushiTaskToast');
    if(!t){t=document.createElement('div');t.id='sushiTaskToast';document.body.append(t)}
    t.textContent=text;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200);
  }
  function update(type,value,mode='add'){
    if(!QUESTS[type])return state();
    const l=read(),q=ensure(l),def=QUESTS[type];
    if(!q.active.includes(type)||q.claimed[type])return state();
    q.progress[type]=mode==='set'?Math.max(q.progress[type],Number(value)||0):q.progress[type]+Math.max(0,Number(value)||0);
    q.progress[type]=Math.min(q.progress[type],def.goal);
    if(q.progress[type]>=def.goal&&!q.claimed[type]){
      q.claimed[type]=true;
      l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+def.reward;
      toast(`✅ ${def.label} 達成！ +${def.reward}💎`);
      navigator.vibrate?.([18,28,35]);
    }
    write(l);render();return state();
  }
  function state(){const l=read(),q=ensure(l);return {day:q.day,active:[...q.active],progress:{...q.progress},claimed:{...q.claimed},chestClaimed:q.chestClaimed,chestReward:q.chestReward||0,gems:Number.isSafeInteger(l.gems)?l.gems:0}}
  function chest(){
    const l=read(),q=ensure(l);
    if(q.chestClaimed||!q.active.every(k=>q.claimed[k]))return;
    const r=Math.random(),amount=r<.60?5:r<.90?10:r<.98?15:30;
    q.chestClaimed=true;q.chestReward=amount;
    l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+amount;
    write(l);render();toast(`🎁 デイリーコンプリート！ +${amount}💎`);navigator.vibrate?.([30,35,30,35,70]);
  }
  function open(){document.getElementById('sushiDailySheet')?.classList.add('open');render()}
  function close(){document.getElementById('sushiDailySheet')?.classList.remove('open')}
  window.SushiDailyQuest={add:(t,n=1)=>update(t,n,'add'),set:(t,n)=>update(t,n,'set'),state,open};

  const css=document.createElement('style');
  css.id='sushiTaskbarStyle';
  css.textContent=`#loginBonus{display:none!important}#sushiTaskbar{position:fixed;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,calc(100% - 20px));height:64px;z-index:99990;background:rgba(255,253,248,.96);border:1px solid #eadfce;border-radius:22px;box-shadow:0 10px 35px rgba(15,23,42,.20);display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;backdrop-filter:blur(14px);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}#sushiTaskbar a,#sushiTaskbar button{position:relative;border:0;background:transparent;text-decoration:none;color:#31413d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:850 10px/1.1 system-ui;cursor:pointer;padding:4px}#sushiTaskbar a:not(:last-child),#sushiTaskbar button:not(:last-child){border-right:1px solid #eee6d8}#sushiTaskbar .ico{font-size:23px;line-height:1}#sushiTaskbar .mini{font-size:8px;color:#8a877d;font-weight:750}#sushiTaskbar .badge{position:absolute;top:5px;right:13%;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#f4511e;color:#fff;display:grid;place-items:center;font-size:8px;border:2px solid #fff}#sushiTaskToast{position:fixed;left:50%;bottom:86px;transform:translate(-50%,12px);opacity:0;z-index:100001;background:#173f37;color:white;padding:11px 16px;border-radius:999px;font:900 12px/1.2 system-ui;box-shadow:0 8px 25px #0004;pointer-events:none;transition:.2s;white-space:nowrap}#sushiTaskToast.show{opacity:1;transform:translate(-50%,0)}#sushiDailySheet{position:fixed;inset:0;z-index:99999;background:rgba(20,35,32,.54);display:none;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}#sushiDailySheet.open{display:flex}.sdq-card{width:min(560px,100%);max-height:78dvh;overflow:auto;background:#fffdf8;border-radius:25px 25px 0 0;padding:18px 18px calc(82px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px #0003;color:#243b37}.sdq-head{display:flex;justify-content:space-between;align-items:center}.sdq-head h2{margin:0;font-size:19px}.sdq-close{border:0;background:#f3ede0;border-radius:50%;width:34px;height:34px;font-size:20px}.sdq-note{font-size:11px;color:#7c8178;margin:5px 0 14px}.sdq-row{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;border:1px solid #eee2cf;border-radius:15px;padding:10px;margin:8px 0;background:#fff}.sdq-row.done{background:#eff8ef;border-color:#b8d8ba}.sdq-icon{font-size:24px}.sdq-name{font-size:12px;font-weight:900}.sdq-progress{height:7px;background:#eee8dd;border-radius:99px;overflow:hidden;margin-top:6px}.sdq-progress i{display:block;height:100%;background:#f4511e;border-radius:99px}.sdq-num{font-size:10px;color:#777;margin-top:4px}.sdq-reward{font-size:11px;font-weight:900;color:#9b6d19;white-space:nowrap}.sdq-chest{width:100%;margin-top:13px;border:0;border-radius:16px;padding:14px;background:linear-gradient(180deg,#f7c95c,#e7a82a);color:#5b3b09;font-weight:1000;font-size:14px;box-shadow:0 5px 12px #d69c2933}.sdq-chest:disabled{background:#e7e2d8;color:#918d84;box-shadow:none}.sdq-chest.claimed{background:#e9f4e8;color:#397044}body.sushi-taskbar-on{padding-bottom:max(78px,calc(70px + env(safe-area-inset-bottom)))}body.sushi-taskbar-on #homeAvatarWalker{bottom:72px!important}body.sushi-taskbar-on #sushiAvatarWidget{bottom:76px!important}body.sushi-taskbar-on #sushiGemToast{bottom:84px!important}body.sushi-taskbar-on #controlBar{bottom:64px!important}@media(max-width:600px){#sushiTaskbar{left:0;right:0;bottom:0;transform:none;width:100%;height:62px;border-radius:16px 16px 0 0;border-left:0;border-right:0;border-bottom:0}#sushiTaskbar .ico{font-size:21px}#sushiTaskbar .badge{right:9%}#sushiTaskToast{bottom:76px}.sdq-card{padding-bottom:calc(76px + env(safe-area-inset-bottom))}body.sushi-taskbar-on #homeAvatarWalker{bottom:64px!important}body.sushi-taskbar-on #sushiAvatarWidget{bottom:67px!important}body.sushi-taskbar-on #controlBar{bottom:62px!important}}`;
  document.head.append(css);

  const bar=document.createElement('nav');
  bar.id='sushiTaskbar';bar.setAttribute('aria-label','すし単メニュー');
  bar.innerHTML=`<a id="sushiLoginTab" href="/index.html"><span class="ico">🎁</span><span>ログボ</span><small class="mini"></small></a><a href="/sushigacha/sushi-gacha.html"><span class="ico">🍣</span><span>ガチャ</span><small class="mini">💎 <b id="sushiBarGems">0</b></small></a><a href="/sushigacha/sushi-avatar.html"><span class="ico">👤</span><span>アバター</span><small class="mini">きせかえ</small></a><button id="sushiDailyTab" type="button"><span class="ico">✅</span><span>デイリー</span><small class="mini">0 / 4</small><i class="badge">0</i></button>`;
  document.body.append(bar);document.body.classList.add('sushi-taskbar-on');

  const sheet=document.createElement('div');
  sheet.id='sushiDailySheet';
  sheet.innerHTML=`<div class="sdq-card" role="dialog" aria-modal="true" aria-label="デイリークエスト"><div class="sdq-head"><h2>✅ デイリークエスト</h2><button class="sdq-close" type="button" aria-label="閉じる">×</button></div><p class="sdq-note">毎朝6:00に4つを選出。その日の4つはリロードしても変わりません。進捗は累計です。</p><div id="sdqRows"></div><button id="sdqChest" class="sdq-chest" type="button"></button></div>`;
  document.body.append(sheet);
  sheet.querySelector('.sdq-close').onclick=close;
  sheet.addEventListener('click',e=>{if(e.target===sheet)close()});
  bar.querySelector('#sushiDailyTab').onclick=open;
  sheet.querySelector('#sdqChest').onclick=chest;

  const login=bar.querySelector('#sushiLoginTab');
  if(location.pathname==='/'||/\/index\.html$/i.test(location.pathname)){
    login.onclick=e=>{e.preventDefault();const l=read(),got=Array.isArray(l.dailyGemClaims)&&l.dailyGemClaims.includes(day());toast(got?'🎁 今日のログインボーナスは受取済み':'🎁 ログインボーナスを確認中…')};
  }
  function render(){
    const l=read(),q=ensure(l),done=q.active.filter(k=>q.claimed[k]).length;
    bar.querySelector('#sushiBarGems').textContent=(Number.isSafeInteger(l.gems)?l.gems:0).toLocaleString();
    const daily=bar.querySelector('#sushiDailyTab');daily.querySelector('.mini').textContent=`${done} / ${DAILY_COUNT}`;daily.querySelector('.badge').textContent=done;
    const got=Array.isArray(l.dailyGemClaims)&&l.dailyGemClaims.includes(day());login.querySelector('.mini').textContent=got?'受取済':'毎日 +10💎';
    const rows=sheet.querySelector('#sdqRows');
    rows.innerHTML=q.active.map(k=>{const d=QUESTS[k],p=Math.min(d.goal,q.progress[k]||0),pct=Math.round(p/d.goal*100);return `<div class="sdq-row ${q.claimed[k]?'done':''}"><div class="sdq-icon">${d.icon}</div><div><div class="sdq-name">${d.label}</div><div class="sdq-progress"><i style="width:${pct}%"></i></div><div class="sdq-num">${Math.floor(p)} / ${d.goal}${d.unit}</div></div><div class="sdq-reward">${q.claimed[k]?'✓ GET':`+${d.reward}💎`}</div></div>`}).join('');
    const c=sheet.querySelector('#sdqChest'),all=done===DAILY_COUNT;
    if(q.chestClaimed){c.disabled=true;c.classList.add('claimed');c.textContent=`🎁 コンプリート報酬 +${q.chestReward}💎 受取済み`}
    else if(all){c.disabled=false;c.classList.remove('claimed');c.textContent='🎁 デイリーコンプリート宝箱を開ける！'}
    else{c.disabled=true;c.classList.remove('claimed');c.textContent=`🔒 あと ${DAILY_COUNT-done} 個でコンプリート宝箱`}
  }
  render();
  window.addEventListener('storage',e=>{if(e.key===KEY||e.key===ACTIVE_KEY)render()});
  window.addEventListener('sushi-daily-quest-change',render);
  window.addEventListener('focus',render);
  window.addEventListener('pageshow',render);

  const page=decodeURIComponent((location.pathname.split('/').pop()||'index.html').toLowerCase());
  const simpleMap={'sushitan.html':'sushitan','shinotan.html':'shino','antonitan.html':'antoni'};
  if(simpleMap[page]){
    const key=simpleMap[page],states=new WeakMap();
    const inspect=el=>{const now=el.classList.contains('good')||el.classList.contains('correct-flash');const before=states.get(el)||false;if(now&&!before)update(key,1);states.set(el,now)};
    const scan=()=>document.querySelectorAll('.feedback,.balloon,#feedbackText').forEach(inspect);
    new MutationObserver(ms=>{ms.forEach(m=>{if(m.target instanceof Element)inspect(m.target);m.addedNodes.forEach?.(n=>{if(n instanceof Element){inspect(n);n.querySelectorAll?.('.feedback,.balloon,#feedbackText').forEach(inspect)}})})}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    scan();
  }
  if(page==='sushi_idiom (1).html'||page==='sushi_idiom.html'||page==='sushi_quiz.html'){
    const key=page.startsWith('sushi_quiz')?'quiz':'idiom',counted=new WeakSet();
    document.addEventListener('click',e=>{const el=e.target.closest?.('.choice,button');if(!el||counted.has(el))return;setTimeout(()=>{if(el.classList.contains('correct')||el.classList.contains('correct-flash')||el.getAttribute('data-correct')==='true'){counted.add(el);update(key,1)}},80)},true);
  }
  if(page==='sushitalk.html'){
    const seen=new WeakSet();
    const scan=()=>document.querySelectorAll('.delta').forEach(el=>{if(seen.has(el))return;seen.add(el);const n=Number((el.textContent||'').replace(/[^+\-\d.]/g,''));if(n>0)update('talk',1)});
    new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true});scan();
  }
  if(page==='sukaishi_world_study_v03.html'||page==='sukaishi.html'){
    let was=false;
    const check=()=>{const el=document.getElementById('judge');if(!el)return;const now=/✓\s*CORRECT/i.test(el.textContent||'');if(now&&!was)update('world',1);was=now};
    new MutationObserver(check).observe(document.documentElement,{subtree:true,childList:true,characterData:true});check();
  }
})();