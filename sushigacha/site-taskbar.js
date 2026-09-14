'use strict';
(()=>{
  if(window.__sushiSiteTaskbarLoaded)return;
  window.__sushiSiteTaskbarLoaded=true;

  const KEY='sushitan_login_bonus_v1',ACTIVE_KEY='sushitan_daily_active_v1';
  const QUESTS={
    sushitan:{label:'すし単',icon:'🍣',goal:30,reward:5,unit:'問',href:'/sushitan.html'},
    shino:{label:'しの単',icon:'🟣',goal:20,reward:5,unit:'問',href:'/shinotan.html'},
    antoni:{label:'あんとに単',icon:'🔴',goal:20,reward:5,unit:'問',href:'/antonitan.html'},
    idiom:{label:'すしイディオム',icon:'🍱',goal:10,reward:4,unit:'問',href:'/sushi_idiom%20(1).html'},
    quiz:{label:'すしクイズ',icon:'❓',goal:10,reward:4,unit:'問',href:'/sushi_quiz.html'},
    talk:{label:'すしTalk',icon:'💬',goal:10,reward:3,unit:'問',href:'/sushitalk.html'},
    world:{label:'す界し',icon:'🌍',goal:5,reward:3,unit:'問',href:'/sukaishi_world_study_v03.html'},
    run:{label:'すしRUN',icon:'🏃',goal:1500,reward:5,unit:'m',href:'/sushi_run.html'}
  };
  const KEYS=Object.keys(QUESTS),COUNT=4;
  const day=()=>{const d=new Date();d.setHours(d.getHours()-6);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{}}catch{return {}}};
  const write=l=>{localStorage.setItem(KEY,JSON.stringify(l));window.dispatchEvent(new CustomEvent('sushi-daily-quest-change'))};
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function pick(date){let seed=hash('sushitan-daily-'+date),a=[...KEYS];for(let i=a.length-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,COUNT)}
  function valid(a){return Array.isArray(a)&&a.length===COUNT&&new Set(a).size===COUNT&&a.every(k=>QUESTS[k])}
  function activeFor(date,existing){let s=null;try{s=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null')}catch{}if(s&&s.day===date&&valid(s.active))return [...s.active];const a=valid(existing)?[...existing]:pick(date);localStorage.setItem(ACTIVE_KEY,JSON.stringify({day:date,active:a}));return a}
  function ensure(l){const t=day(),same=l.dailyQuests?.day===t,a=activeFor(t,same?l.dailyQuests.active:null);if(!same)l.dailyQuests={day:t,active:a,progress:{},claimed:{},chestClaimed:false,chestReward:0};const q=l.dailyQuests;q.active=a;q.progress=q.progress&&typeof q.progress==='object'?q.progress:{};q.claimed=q.claimed&&typeof q.claimed==='object'?q.claimed:{};KEYS.forEach(k=>{q.progress[k]=Math.max(0,Number(q.progress[k])||0);q.claimed[k]=!!q.claimed[k]});return q}
  function toast(text){let t=document.getElementById('sushiTaskToast');if(!t){t=document.createElement('div');t.id='sushiTaskToast';document.body.append(t)}t.textContent=text;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
  function update(type,value,mode='add'){if(!QUESTS[type])return state();const l=read(),q=ensure(l),d=QUESTS[type];if(!q.active.includes(type)||q.claimed[type])return state();q.progress[type]=mode==='set'?Math.max(q.progress[type],Number(value)||0):q.progress[type]+Math.max(0,Number(value)||0);q.progress[type]=Math.min(q.progress[type],d.goal);if(q.progress[type]>=d.goal&&!q.claimed[type]){q.claimed[type]=true;l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+d.reward;toast(`✅ ${d.label} 達成！ +${d.reward}💎`);navigator.vibrate?.([18,28,35])}write(l);render();return state()}
  function state(){const l=read(),q=ensure(l);return {day:q.day,active:[...q.active],progress:{...q.progress},claimed:{...q.claimed},chestClaimed:q.chestClaimed,chestReward:q.chestReward||0,gems:Number.isSafeInteger(l.gems)?l.gems:0}}
  function chest(){const l=read(),q=ensure(l);if(q.chestClaimed||!q.active.every(k=>q.claimed[k]))return;const r=Math.random(),n=r<.60?5:r<.90?10:r<.98?15:30;q.chestClaimed=true;q.chestReward=n;l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+n;write(l);render();toast(`🎁 デイリーコンプリート！ +${n}💎`)}
  window.SushiDailyQuest={add:(t,n=1)=>update(t,n,'add'),set:(t,n)=>update(t,n,'set'),state,open:()=>{document.getElementById('sushiDailySheet')?.classList.add('open');render()}};

  function previousDay(s){const d=new Date(`${s}T12:00:00`);d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function loginInfo(l){
    const manual=Array.isArray(l.loginManualClaims)?l.loginManualClaims:[];
    const claimed=manual.includes(day());
    const total=Math.max(0,Math.floor(Number(l.loginBonusTotal)||0));
    const streak=Math.max(0,Math.floor(Number(l.loginBonusStreak)||0));
    return {manual,claimed,total,streak};
  }
  function migrateLogin(l){
    const t=day();
    l.loginManualClaims=Array.isArray(l.loginManualClaims)?l.loginManualClaims:[];
    l.dailyGemClaims=Array.isArray(l.dailyGemClaims)?l.dailyGemClaims:[];
    if(!l.loginButtonModeV1){
      const historical=Math.max(Number.isSafeInteger(l.total)?l.total:0,new Set(l.dailyGemClaims).size);
      l.loginBonusTotal=Math.max(0,historical);
      l.loginBonusStreak=Math.max(0,Number.isSafeInteger(l.streak)?l.streak:0);
      l.loginBonusLastDay=typeof l.lastLoginDay==='string'?l.lastLoginDay:null;
      if(l.dailyGemClaims.includes(t))l.loginManualClaims.push(t);
      l.loginButtonModeV1=true;
    }
    // Block the old home-page auto-grant. The taskbar button is now the single claim path.
    if(!l.dailyGemClaims.includes(t))l.dailyGemClaims.push(t);
    l.dailyGemClaims=l.dailyGemClaims.slice(-400);
    l.loginAvatarMilestones=Array.isArray(l.loginAvatarMilestones)?l.loginAvatarMilestones:[];
    const oldTotal=Number.isSafeInteger(l.total)?l.total:0;
    if(oldTotal>0&&!l.loginAvatarMilestones.includes(oldTotal))l.loginAvatarMilestones.push(oldTotal);
    return l;
  }
  function stamp(text='出席'){let s=document.getElementById('sushiLoginStamp');if(!s){s=document.createElement('div');s.id='sushiLoginStamp';document.body.appendChild(s)}s.textContent=text;s.classList.remove('hit');void s.offsetWidth;s.classList.add('hit');clearTimeout(s._timer);s._timer=setTimeout(()=>s.classList.remove('hit'),1100)}
  function claimLogin(){
    const l=migrateLogin(read()),t=day(),info=loginInfo(l);
    if(info.claimed){write(l);render();stamp('済');toast('🎁 今日のログインボーナスは受取済み');return}
    const prev=l.loginBonusLastDay;
    const streak=prev===previousDay(t)?info.streak+1:1;
    const total=info.total+1;
    let bonusTotal=0,bonusStreak=0;
    if(total%100===0)bonusTotal=1000;else if(total%10===0)bonusTotal=100;
    if(streak%10===0)bonusStreak=300;else if(streak%3===0)bonusStreak=100;
    const base=10,earned=base+bonusTotal+bonusStreak;
    l.gems=(Number.isSafeInteger(l.gems)?l.gems:0)+earned;
    l.loginBonusTotal=total;l.loginBonusStreak=streak;l.loginBonusLastDay=t;l.loginManualClaims=[...info.manual,t].slice(-400);
    write(l);render();stamp('出席');navigator.vibrate?.([20,35,70]);
    const parts=[`毎日 +${base}💎`];if(bonusTotal)parts.push(`累計${total}日 +${bonusTotal}💎`);if(bonusStreak)parts.push(`${streak}日連続 +${bonusStreak}💎`);toast(`🎉 ${parts.join(' / ')}`);
  }
  {const l=migrateLogin(read());write(l)}

  const css=document.createElement('style');css.id='sushiTaskbarStyle';css.textContent=`#loginBonus{display:none!important}#sushiTaskbar{position:fixed;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,calc(100% - 20px));height:64px;z-index:99990;background:rgba(255,253,248,.96);border:1px solid #eadfce;border-radius:22px;box-shadow:0 10px 35px #0f172a33;display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden;backdrop-filter:blur(14px);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}#sushiTaskbar a,#sushiTaskbar button{position:relative;border:0;background:transparent;text-decoration:none;color:#31413d;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:850 10px/1.1 system-ui;cursor:pointer;padding:4px}#sushiTaskbar a:not(:last-child),#sushiTaskbar button:not(:last-child){border-right:1px solid #eee6d8}#sushiTaskbar .ico{font-size:23px;line-height:1}#sushiTaskbar .mini{font-size:8px;color:#8a877d;font-weight:750}#sushiTaskbar .badge{position:absolute;top:5px;right:13%;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:#f4511e;color:#fff;display:grid;place-items:center;font-size:8px;border:2px solid #fff}#sushiTaskToast{position:fixed;left:50%;bottom:86px;transform:translate(-50%,12px);opacity:0;z-index:100001;background:#173f37;color:white;padding:11px 16px;border-radius:999px;font:900 12px/1.2 system-ui;box-shadow:0 8px 25px #0004;pointer-events:none;transition:.2s;white-space:nowrap}#sushiTaskToast.show{opacity:1;transform:translate(-50%,0)}#sushiLoginStamp{position:fixed;left:50%;top:46%;z-index:100005;width:120px;height:120px;border:8px double #c62828;border-radius:50%;display:grid;place-items:center;color:#c62828;background:#fffdf8e8;font:1000 30px/1 system-ui;letter-spacing:.12em;transform:translate(-50%,-50%) rotate(-12deg) scale(2.4);opacity:0;pointer-events:none;box-shadow:inset 0 0 0 4px #fffdf8,0 8px 30px #0002;text-shadow:0 1px 0 #fff}#sushiLoginStamp.hit{animation:sushiStampHit 1s cubic-bezier(.18,.9,.25,1) both}@keyframes sushiStampHit{0%{opacity:0;transform:translate(-50%,-50%) rotate(-18deg) scale(2.6)}28%{opacity:1;transform:translate(-50%,-50%) rotate(-9deg) scale(.88)}42%{transform:translate(-50%,-50%) rotate(-11deg) scale(1.03)}68%{opacity:1;transform:translate(-50%,-50%) rotate(-11deg) scale(1)}100%{opacity:0;transform:translate(-50%,-54%) rotate(-11deg) scale(.96)}}#sushiDailySheet{position:fixed;inset:0;z-index:99999;background:#1423208a;display:none;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}#sushiDailySheet.open{display:flex}.sdq-card{width:min(560px,100%);max-height:78dvh;overflow:auto;background:#fffdf8;border-radius:25px 25px 0 0;padding:18px 18px calc(82px + env(safe-area-inset-bottom));box-shadow:0 -12px 40px #0003;color:#243b37}.sdq-head{display:flex;justify-content:space-between;align-items:center}.sdq-head h2{margin:0;font-size:19px}.sdq-close{border:0;background:#f3ede0;border-radius:50%;width:34px;height:34px;font-size:20px}.sdq-note{font-size:11px;color:#7c8178;margin:5px 0 14px}.sdq-row{display:grid;grid-template-columns:36px 1fr auto;gap:10px;align-items:center;border:1px solid #eee2cf;border-radius:15px;padding:10px;margin:8px 0;background:#fff;text-decoration:none;color:inherit;cursor:pointer}.sdq-row:active{transform:scale(.99)}.sdq-row.done{background:#eff8ef;border-color:#b8d8ba}.sdq-icon{font-size:24px}.sdq-name{font-size:12px;font-weight:900}.sdq-progress{height:7px;background:#eee8dd;border-radius:99px;overflow:hidden;margin-top:6px}.sdq-progress i{display:block;height:100%;background:#f4511e;border-radius:99px}.sdq-num{font-size:10px;color:#777;margin-top:4px}.sdq-reward{font-size:11px;font-weight:900;color:#9b6d19;white-space:nowrap}.sdq-go{font-size:18px;color:#c76525;margin-left:5px}.sdq-chest{width:100%;margin-top:13px;border:0;border-radius:16px;padding:14px;background:linear-gradient(180deg,#f7c95c,#e7a82a);color:#5b3b09;font-weight:1000;font-size:14px}.sdq-chest:disabled{background:#e7e2d8;color:#918d84}.sdq-chest.claimed{background:#e9f4e8;color:#397044}body.sushi-taskbar-on{padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)));scroll-padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))}body.sushi-taskbar-on .modal{padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))!important;scroll-padding-bottom:max(124px,calc(96px + env(safe-area-inset-bottom)))}body.sushi-taskbar-on #homeAvatarWalker{bottom:72px!important}body.sushi-taskbar-on #sushiAvatarWidget{bottom:76px!important}body.sushi-taskbar-on #sushiGemToast{bottom:84px!important}body.sushi-taskbar-on #controlBar{bottom:64px!important}@media(max-width:600px){#sushiTaskbar{left:0;right:0;bottom:0;transform:none;width:100%;height:62px;border-radius:16px 16px 0 0;border-left:0;border-right:0;border-bottom:0}#sushiTaskbar .ico{font-size:21px}#sushiTaskToast{bottom:76px}.sdq-card{padding-bottom:calc(76px + env(safe-area-inset-bottom))}}`;document.head.append(css);

  const bar=document.createElement('nav');bar.id='sushiTaskbar';bar.innerHTML=`<a id="sushiLoginTab" href="#"><span class="ico">🎁</span><span>ログボ</span><small class="mini"></small></a><a href="/sushigacha/sushi-gacha.html"><span class="ico">🍣</span><span>ガチャ</span><small class="mini">💎 <b id="sushiBarGems">0</b></small></a><a href="/sushigacha/sushi-avatar.html"><span class="ico">👤</span><span>アバター</span><small class="mini">きせかえ</small></a><button id="sushiDailyTab" type="button"><span class="ico">✅</span><span>デイリー</span><small class="mini">0 / 4</small><i class="badge">0</i></button>`;document.body.append(bar);document.body.classList.add('sushi-taskbar-on');
  const sheet=document.createElement('div');sheet.id='sushiDailySheet';sheet.innerHTML=`<div class="sdq-card"><div class="sdq-head"><h2>✅ デイリークエスト</h2><button class="sdq-close" type="button">×</button></div><p class="sdq-note">毎朝6:00に4つを選出。進捗はその日の累計です。クエストをタップするとゲームへ移動します。</p><div id="sdqRows"></div><button id="sdqChest" class="sdq-chest" type="button"></button></div>`;document.body.append(sheet);
  sheet.querySelector('.sdq-close').onclick=()=>sheet.classList.remove('open');sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.classList.remove('open')});bar.querySelector('#sushiDailyTab').onclick=()=>{sheet.classList.add('open');render()};sheet.querySelector('#sdqChest').onclick=chest;sheet.querySelector('#sdqRows').addEventListener('click',e=>{const row=e.target.closest?.('.sdq-row');if(!row)return;e.preventDefault();e.stopPropagation();const href=row.getAttribute('href');if(href){sheet.classList.remove('open');window.location.assign(new URL(href,window.location.origin).href)}});
  const login=bar.querySelector('#sushiLoginTab');login.onclick=e=>{e.preventDefault();claimLogin()};
  function render(){const l=read(),q=ensure(l),done=q.active.filter(k=>q.claimed[k]).length,li=loginInfo(l);bar.querySelector('#sushiBarGems').textContent=(Number.isSafeInteger(l.gems)?l.gems:0).toLocaleString();const dtab=bar.querySelector('#sushiDailyTab');dtab.querySelector('.mini').textContent=`${done} / ${COUNT}`;dtab.querySelector('.badge').textContent=done;login.querySelector('.mini').textContent=li.claimed?`受取済・${li.streak}日連続`:'タップで +10💎';sheet.querySelector('#sdqRows').innerHTML=q.active.map(k=>{const d=QUESTS[k],p=Math.min(d.goal,q.progress[k]||0),pct=Math.round(p/d.goal*100);return `<a class="sdq-row ${q.claimed[k]?'done':''}" href="${d.href}"><div class="sdq-icon">${d.icon}</div><div><div class="sdq-name">${d.label}</div><div class="sdq-progress"><i style="width:${pct}%"></i></div><div class="sdq-num">${Math.floor(p)} / ${d.goal}${d.unit}</div></div><div class="sdq-reward">${q.claimed[k]?'✓ GET':`+${d.reward}💎`}<span class="sdq-go">›</span></div></a>`}).join('');const c=sheet.querySelector('#sdqChest'),all=done===COUNT;if(q.chestClaimed){c.disabled=true;c.classList.add('claimed');c.textContent=`🎁 コンプリート報酬 +${q.chestReward}💎 受取済み`}else if(all){c.disabled=false;c.classList.remove('claimed');c.textContent='🎁 デイリーコンプリート宝箱を開ける！'}else{c.disabled=true;c.classList.remove('claimed');c.textContent=`🔒 あと ${COUNT-done} 個でコンプリート宝箱`}}
  render();['storage','focus','pageshow','sushi-daily-quest-change'].forEach(ev=>window.addEventListener(ev,render));
  {const page=decodeURIComponent((location.pathname.split('/').pop()||'').toLowerCase());if((page==='sushi_idiom (1).html'||page==='sushi_idiom.html')&&!document.querySelector('script[src*="daily-quest-click-bridge.js"]')){const s=document.createElement('script');s.src='/sushigacha/daily-quest-click-bridge.js?v=20260914-5';document.head.appendChild(s)}}
})();