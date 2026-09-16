'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const readLedger=()=>{try{return JSON.parse(localStorage.getItem(LEDGER)||'{}')||{}}catch(_e){return {}}};
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

  normalizeSevenDayReward();installLoginCardModal();
  window.addEventListener('pageshow',()=>{normalizeSevenDayReward();installLoginCardModal()});
  window.addEventListener('storage',e=>{if(e.key===LEDGER){normalizeSevenDayReward();renderLoginCard()}});

  const root=document.createElement('div');root.id='homeAvatarWalker';root.innerHTML='<div class="home-avatar-bubble" hidden></div><button class="home-avatar-char" aria-label="アバターを開く"></button>';document.body.appendChild(root);
  const char=root.querySelector('.home-avatar-char'),bubble=root.querySelector('.home-avatar-bubble');
  const st=document.createElement('style');st.textContent=`#homeAvatarWalker{position:fixed;left:0;right:0;bottom:4px;height:132px;z-index:7;pointer-events:none;overflow:visible}#homeAvatarWalker:before{content:"";position:absolute;left:0;right:0;bottom:0;height:15px;background:linear-gradient(180deg,rgba(244,81,30,0),rgba(244,81,30,.08));border-bottom:1px solid rgba(194,65,12,.12)}#homeAvatarWalker .home-avatar-char{position:absolute;left:18px;bottom:0;width:90px;height:114px;border:0;background:transparent;padding:0;pointer-events:auto;cursor:pointer;transition:left .07s linear;filter:drop-shadow(0 5px 4px rgba(15,23,42,.18));transform-origin:50% 100%;z-index:4;touch-action:manipulation}#homeAvatarWalker .home-avatar-char svg{width:100%;height:100%;display:block;overflow:visible}#homeAvatarWalker .home-avatar-bubble{position:absolute;bottom:106px;min-width:90px;max-width:220px;padding:7px 10px;border-radius:13px;background:#fffaf2;border:1px solid #fed7aa;color:#7c2d12;font-size:11px;font-weight:900;text-align:center;box-shadow:0 6px 16px rgba(15,23,42,.12);pointer-events:none;white-space:nowrap;z-index:8}#homeAvatarWalker .home-avatar-bubble:after{content:"";position:absolute;left:22px;bottom:-7px;border:7px solid transparent;border-top-color:#fed7aa}#homeAvatarWalker .home-avatar-char.idle-cheer{animation:homeCheer .75s ease both}#homeAvatarWalker .home-avatar-char.idle-sit{animation:homeSit 1.6s ease both}#homeAvatarWalker .home-avatar-char.idle-sleep{animation:homeSleep 2s ease both}#homeAvatarWalker .home-avatar-char.idle-look{animation:homeLook 1.1s ease both}@keyframes homeCheer{0%,100%{transform:translateY(0) rotate(0)}35%{transform:translateY(-15px) rotate(-4deg)}65%{transform:translateY(-8px) rotate(4deg)}}@keyframes homeSit{0%{transform:scaleY(1) translateY(0)}25%,80%{transform:scaleY(.80) translateY(17px)}100%{transform:scaleY(1) translateY(0)}}@keyframes homeSleep{0%{transform:rotate(0)}25%,80%{transform:rotate(7deg) translateY(5px)}100%{transform:rotate(0)}}@keyframes homeLook{0%,100%{transform:rotate(0)}35%{transform:rotate(-5deg)}70%{transform:rotate(5deg)}}@media(max-width:560px){#homeAvatarWalker{height:108px}#homeAvatarWalker .home-avatar-char{width:75px;height:96px}#homeAvatarWalker .home-avatar-bubble{bottom:90px}}`;document.head.appendChild(st);
  function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
  function avatar(){try{const l=readLedger();const a={...(window.DEFAULT_AVATAR||{}),...(l?.gacha?.avatar||{})};if(!a.top&&a.outfit)a.top=a.outfit;return a}catch(_e){return {...(window.DEFAULT_AVATAR||{})}}}
  let x=18,dir='right',walking=true,frame=0,lastFrame=0,lastTurn=0,speed=26,raf=0,idleDir='front',idleAction='look',idleTimer=0;
  const lines=['Ready?','Keep going!','Nice work!','Study time!','You got this!','Let\'s learn!'],actions=['look','cheer','sit','sleep'];
  function render(){if(window.SushiAvatar2D)char.innerHTML=window.SushiAvatar2D.render(avatar(),{direction:walking?dir:idleDir,frame})}
  function say(text){bubble.textContent=text;bubble.hidden=false;bubble.style.left=Math.max(6,Math.min(innerWidth-230,x-4))+'px';clearTimeout(say._t);say._t=setTimeout(()=>bubble.hidden=true,2400)}
  function clearIdleClass(){char.classList.remove('idle-cheer','idle-sit','idle-sleep','idle-look')}
  function resumeWalk(){clearIdleClass();walking=true;dir=Math.random()<.5?'left':'right';speed=20+Math.random()*16;render()}
  function chooseIdle(){walking=false;frame=0;idleDir=Math.random()<.55?'front':(Math.random()<.5?'back':dir);idleAction=actions[Math.floor(Math.random()*actions.length)];clearIdleClass();render();requestAnimationFrame(()=>char.classList.add('idle-'+idleAction));const wait=idleAction==='sleep'?1900:idleAction==='sit'?1500:900;clearTimeout(idleTimer);idleTimer=setTimeout(resumeWalk,wait+Math.random()*700)}
  function tick(t){raf=requestAnimationFrame(tick);const dt=Math.min(.05,(t-(tick.last||t))/1000);tick.last=t;const max=Math.max(18,innerWidth-char.offsetWidth-18);if(walking){x+=(dir==='right'?1:-1)*speed*dt;if(x<=18){x=18;dir='right'}if(x>=max){x=max;dir='left'}char.style.left=x+'px';if(t-lastFrame>135){frame=(frame+1)%4;lastFrame=t;render()}}if(t-lastTurn>4300+Math.random()*2800){lastTurn=t;chooseIdle();if(Math.random()<.5)say(lines[Math.floor(Math.random()*lines.length)])}}
  char.addEventListener('click',()=>location.href='sushigacha/sushi-avatar.html');window.addEventListener('resize',()=>{x=Math.min(x,Math.max(18,innerWidth-char.offsetWidth-18))});window.addEventListener('focus',()=>render());
  (async()=>{try{if(!document.querySelector('script[src*="site-taskbar.js"]'))await load('/sushigacha/site-taskbar.js?v=20260914-2');if(typeof window.avatarSVG!=='function')await load('sushigacha/avatar.js?v=20260914-home6');await load('sushigacha/avatar-polish.js?v=20260913-4');await load('sushigacha/avatar-character-2d.js?v=20260913-1');await load('sushigacha/avatar-character-2d-v2.js?v=20260913-2');render();raf=requestAnimationFrame(tick)}catch(e){console.warn('home avatar walker unavailable',e);root.remove()}})();
})();
