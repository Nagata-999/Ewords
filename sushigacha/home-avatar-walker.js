'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const readLedger=()=>{const l=JSON.parse(localStorage.getItem(LEDGER)||'{}');if(!l||typeof l!=='object'||Array.isArray(l))throw Error('Invalid ledger');return l;};
  const writeLedger=l=>localStorage.setItem(LEDGER,JSON.stringify(l));

  function normalizeSevenDayReward(){
    const l=readLedger();
    const streak=Math.max(0,Number(l.streak)||0);
    const today=l.lastDay||'';
    const shouldReward=streak>0&&streak%7===0;
    if(shouldReward){
      const claimed=Array.isArray(l.claimedMilestones)?l.claimedMilestones:[];
      if(!claimed.includes(today)){l.pending=true;l.pendingDay=today;}
    }else if(l.pendingDay===today){
      l.pending=false;l.pendingDay='';
    }
    writeLedger(l);
    const claim=document.getElementById('loginClaim');
    if(claim)claim.hidden=!l.pending;
    const cycle=document.getElementById('loginCycle');
    if(cycle)cycle.textContent=`${streak?((streak-1)%7)+1:0} / 7`;
    const next=document.getElementById('loginNext');
    const remain=streak?7-(streak%7):7;
    if(next)next.textContent=l.pending?'🎁 7日達成！100ジェムを受け取れ！':`あと${remain}日で100ジェム！`;
  }

  function installLoginCardModal(){
    const host=document.getElementById('loginBonus');if(!host)return;
    const old=document.getElementById('loginStampCard');if(old)old.remove();
    let btn=document.getElementById('loginStampOpen');
    if(!btn){
      btn=document.createElement('button');
      btn.id='loginStampOpen';btn.type='button';btn.className='login-stamp-open';btn.textContent='📅 ログボを見る';
      const next=document.getElementById('loginNext');host.insertBefore(btn,next||null);
    }
    let modal=document.getElementById('loginStampModal');
    if(!modal){
      modal=document.createElement('div');modal.id='loginStampModal';modal.className='login-stamp-modal';modal.hidden=true;
      modal.innerHTML='<div class="login-stamp-panel" role="dialog" aria-modal="true" aria-label="ログインボーナス"><button class="login-stamp-close" type="button" aria-label="閉じる">×</button><div id="loginStampBody"></div></div>';
      document.body.appendChild(modal);
      const css=document.createElement('style');css.id='loginStampModalStyle';css.textContent=`
.login-stamp-open{width:100%;margin-top:13px;padding:13px 16px;border:1px solid #fdba74;border-radius:15px;background:#fff;color:#c2410c;font-size:15px;font-weight:1000;cursor:pointer;box-shadow:0 6px 16px rgba(15,23,42,.06)}
.login-stamp-open:hover{background:#fff7ed}.login-stamp-modal{position:fixed;inset:0;z-index:10020;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(15,23,42,.55);backdrop-filter:blur(3px)}.login-stamp-modal[hidden]{display:none}.login-stamp-panel{position:relative;width:min(94vw,620px);padding:28px 24px 24px;border-radius:26px;background:#fffaf2;border:2px solid #fdba74;box-shadow:0 28px 80px rgba(0,0,0,.28)}.login-stamp-close{position:absolute;right:12px;top:10px;width:38px;height:38px;border:0;border-radius:50%;background:#fff;color:#64748b;font-size:27px;line-height:1;cursor:pointer}.login-card-streak{font-size:22px;font-weight:1000;color:#9a3412}.login-card-total{margin-top:8px;font-size:17px;font-weight:900;color:#475569}.login-card-stamps{display:grid;grid-template-columns:repeat(7,1fr);gap:7px;margin-top:22px}.login-card-stamp{text-align:center;min-width:0}.login-card-icon{height:54px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#fff;border:2px dashed #fdba74;font-size:28px}.login-card-stamp.done .login-card-icon{border-style:solid;background:#ffedd5}.login-card-stamp.reward .login-card-icon{border-color:#38bdf8;background:#f0f9ff}.login-card-day{margin-top:6px;font-size:13px;font-weight:1000;color:#64748b}.login-card-next{margin-top:22px;padding:14px;border-radius:15px;background:#fff3e2;text-align:center;font-size:19px;font-weight:1000;color:#ea580c}@media(max-width:520px){.login-stamp-panel{padding:25px 12px 18px}.login-card-streak{font-size:19px}.login-card-total{font-size:15px}.login-card-stamps{gap:3px}.login-card-icon{height:45px;font-size:23px;border-radius:10px}.login-card-day{font-size:11px}.login-card-next{font-size:17px}}
`;
      document.head.appendChild(css);
      modal.querySelector('.login-stamp-close').addEventListener('click',()=>modal.hidden=true);
      modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true});
      document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.hidden=true});
    }
    btn.onclick=()=>{normalizeSevenDayReward();renderLoginCard();modal.hidden=false};
  }

  function renderLoginCard(){
    const body=document.getElementById('loginStampBody');if(!body)return;
    const l=readLedger(),streak=Math.max(0,Number(l.streak)||0),total=Math.max(0,Number(l.total)||0);
    const cyclePos=streak?((streak-1)%7)+1:0;
    const cycleEnd=streak?streak+(7-cyclePos):7;
    const cycleStart=Math.max(1,cycleEnd-6);
    const remain=streak?7-cyclePos:7;
    const stamps=Array.from({length:7},(_,i)=>{
      const day=cycleStart+i,done=day<=streak,reward=i===6;
      const icon=done?'🍣':reward?'🎁':'○';
      return `<div class="login-card-stamp ${done?'done ':''}${reward?'reward':''}"><div class="login-card-icon">${icon}</div><div class="login-card-day">${day}</div></div>`;
    }).join('');
    body.innerHTML=`<div class="login-card-streak">🔥 連続ログイン ${streak}日目</div><div class="login-card-total">📅 累計ログイン ${total}日</div><div class="login-card-stamps">${stamps}</div><div class="login-card-next">${l.pending?'🎉 100ジェムを受け取れます！':`あと${remain}日で100ジェム！`}</div>`;
  }

  try{normalizeSevenDayReward();installLoginCardModal();}catch(e){console.warn('Login ledger unavailable',e);}
  window.addEventListener('pageshow',()=>{try{normalizeSevenDayReward();installLoginCardModal()}catch(e){console.warn('Login ledger unavailable',e)}});
  window.addEventListener('storage',e=>{if(e.key===LEDGER){try{normalizeSevenDayReward();renderLoginCard()}catch(e){console.warn('Login ledger unavailable',e)}}});

  const base=new URL('.',document.currentScript.src);
  const root=document.createElement('div');root.id='homeAvatarWalker';root.innerHTML='<button class="home-avatar-char" aria-label="アバターにあいさつする"></button><div class="home-avatar-menu" hidden><a href="'+new URL('sushi-avatar.html',base).href+'">着替える</a><button type="button" aria-label="閉じる">×</button></div>';document.body.append(root);
  const char=root.querySelector('.home-avatar-char'),menu=root.querySelector('.home-avatar-menu');
  const st=document.createElement('style');st.textContent='#homeAvatarWalker{position:fixed;left:0;right:0;bottom:max(4px,env(safe-area-inset-bottom));height:125px;pointer-events:none;z-index:7}#homeAvatarWalker .home-avatar-char{position:absolute;bottom:0;left:0;border:0;background:none;padding:0;pointer-events:auto;cursor:pointer;touch-action:manipulation}#homeAvatarWalker svg{display:block;width:100%;height:100%}#homeAvatarWalker .home-avatar-menu{position:absolute;bottom:110px;pointer-events:auto;display:flex;align-items:center;gap:8px;background:#fffaf2;border:1px solid #d9d0be;padding:7px 10px;border-radius:12px;font:13px system-ui}#homeAvatarWalker .home-avatar-menu[hidden]{display:none}#homeAvatarWalker a{color:#367c71}#homeAvatarWalker .home-avatar-menu button{border:0;background:none;font-size:18px}#homeAvatarWalker button:focus-visible{outline:3px solid #367c71;border-radius:10px}';document.head.append(st);
  function loadScript(name){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(name+'?v=20261006-1',base).href;s.onload=resolve;s.onerror=reject;document.head.append(s);});}
  let actor=null,raf=0,last=0,x=18,dir='right',mode='walk',elapsed=0,deadline=6,settings={},walkTime=0;
  const media=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>settings.reduced||media.matches;
  const max=()=>Math.max(18,innerWidth-char.offsetWidth-18);
  function position(){x=Math.max(18,Math.min(max(),x));char.style.transform=`translateX(${x.toFixed(1)}px)`;menu.style.left=Math.max(4,Math.min(innerWidth-145,x))+'px';}
  function setMode(next){mode=next;actor?.setOptions({action:next==='turn'?'idle':next,direction:next==='walk'?dir:'front',reduced:reduced(),paused:settings.hidden});}
  function tick(t){raf=0;if(document.hidden||settings.hidden||reduced())return;raf=requestAnimationFrame(tick);const dt=last?Math.min(.05,(t-last)/1000):0;last=t;elapsed+=dt;
    if(mode==='walk'){walkTime+=dt;const edge=dir==='right'?max()-x:x-18;const speed=27*Math.min(1,Math.max(.2,edge/22),Math.max(.2,walkTime/.4));x+=(dir==='right'?1:-1)*speed*dt;if(x<=18||x>=max()){position();setMode('turn');deadline=elapsed+.65;}}
    if(elapsed>=deadline){if(mode==='turn'){dir=dir==='right'?'left':'right';walkTime=0;setMode('walk');deadline=elapsed+6;}else if(mode==='walk'){setMode(Math.random()<.5?'idle':'sit');deadline=elapsed+2.8;}else if(menu.hidden){walkTime=0;setMode('walk');deadline=elapsed+6;}}
    position();
  }
  function sync(){if(!actor)return;cancelAnimationFrame(raf);raf=0;last=0;try{const state=SushiAvatarStore.load();settings=state.settings;actor.setAvatar(state.avatar);root.hidden=settings.hidden;char.style.height=settings.size+'px';char.style.width=Math.round(settings.size*160/204)+'px';menu.style.bottom=settings.size+'px';actor.setOptions({action:reduced()?'idle':mode==='turn'?'idle':mode,direction:reduced()?'front':mode==='walk'?dir:'front',reduced:reduced(),paused:settings.hidden});position();if(!document.hidden&&!settings.hidden&&!reduced())raf=requestAnimationFrame(tick);}catch(e){root.hidden=true;actor.setOptions({paused:true});console.warn('Avatar data could not be read',e);}}
  char.onclick=()=>{menu.hidden=!menu.hidden;if(!menu.hidden){setMode('wave');deadline=elapsed+2;}else{setMode('walk');deadline=elapsed+6;}};
  menu.querySelector('button').onclick=()=>{menu.hidden=true;char.focus();setMode('walk');deadline=elapsed+6;};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;char.focus();setMode('walk');deadline=elapsed+6;}});
  (async()=>{try{if(!window.__sushiSiteTaskbarLoaded)await loadScript('site-taskbar.js');if(typeof avatarSVG!=='function')await loadScript('avatar.js');if(!window.SushiAvatarV2)await loadScript('avatar-engine.js');if(!window.SushiAvatarStore)await loadScript('avatar-state.js');actor=SushiAvatarV2.mount(char,SushiAvatarStore.load().avatar,{action:'walk',direction:dir});sync();window.addEventListener('storage',e=>{if(e.key===SushiAvatarStore.KEY)sync();});window.addEventListener('sushi-avatar-changed',sync);window.addEventListener('focus',sync);window.addEventListener('pageshow',sync);window.addEventListener('resize',position);document.addEventListener('visibilitychange',sync);media.addEventListener('change',sync);window.addEventListener('sushi-avatar-reaction',()=>{setMode('celebrate');deadline=elapsed+1.8;});}catch(e){console.warn('Home avatar unavailable',e);actor?.destroy();root.remove();}})();
})();

