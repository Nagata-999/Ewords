'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const root=document.createElement('div');
  root.id='homeAvatarWalker';
  root.innerHTML='<div class="home-avatar-bubble" hidden></div><button class="home-avatar-char" aria-label="アバターを開く"></button>';
  document.body.appendChild(root);
  const char=root.querySelector('.home-avatar-char');
  const bubble=root.querySelector('.home-avatar-bubble');
  const st=document.createElement('style');
  st.textContent=`
    #homeAvatarWalker{position:fixed;left:0;right:0;bottom:4px;height:124px;z-index:7;pointer-events:none;overflow:visible}
    #homeAvatarWalker .home-avatar-char{position:absolute;left:18px;bottom:0;width:90px;height:114px;border:0;background:transparent;padding:0;pointer-events:auto;cursor:pointer;transition:left .07s linear;filter:drop-shadow(0 5px 4px rgba(15,23,42,.18));transform-origin:50% 100%}
    #homeAvatarWalker .home-avatar-char svg{width:100%;height:100%;display:block;overflow:visible}
    #homeAvatarWalker .home-avatar-bubble{position:absolute;bottom:102px;min-width:90px;max-width:170px;padding:7px 10px;border-radius:13px;background:#fffaf2;border:1px solid #fed7aa;color:#7c2d12;font-size:11px;font-weight:900;text-align:center;box-shadow:0 6px 16px rgba(15,23,42,.12);pointer-events:none;white-space:nowrap}
    #homeAvatarWalker .home-avatar-bubble:after{content:"";position:absolute;left:22px;bottom:-7px;border:7px solid transparent;border-top-color:#fed7aa}
    #homeAvatarWalker .home-avatar-char.idle-cheer{animation:homeCheer .75s ease both}
    #homeAvatarWalker .home-avatar-char.idle-sit{animation:homeSit 1.6s ease both}
    #homeAvatarWalker .home-avatar-char.idle-sleep{animation:homeSleep 2s ease both}
    #homeAvatarWalker .home-avatar-char.idle-look{animation:homeLook 1.1s ease both}
    @keyframes homeCheer{0%,100%{transform:translateY(0) rotate(0)}35%{transform:translateY(-15px) rotate(-4deg)}65%{transform:translateY(-8px) rotate(4deg)}}
    @keyframes homeSit{0%{transform:scaleY(1) translateY(0)}25%,80%{transform:scaleY(.80) translateY(17px)}100%{transform:scaleY(1) translateY(0)}}
    @keyframes homeSleep{0%{transform:rotate(0)}25%,80%{transform:rotate(7deg) translateY(5px)}100%{transform:rotate(0)}}
    @keyframes homeLook{0%,100%{transform:rotate(0)}35%{transform:rotate(-5deg)}70%{transform:rotate(5deg)}}
    @media(max-width:560px){#homeAvatarWalker{height:104px}#homeAvatarWalker .home-avatar-char{width:75px;height:96px}#homeAvatarWalker .home-avatar-bubble{bottom:87px}}
  `;
  document.head.appendChild(st);

  function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  function avatar(){try{const l=JSON.parse(localStorage.getItem(LEDGER)||'{}');const a={...(window.DEFAULT_AVATAR||{}),...(l?.gacha?.avatar||{})};if(!a.top&&a.outfit)a.top=a.outfit;return a;}catch(_e){return {...(window.DEFAULT_AVATAR||{})};}}

  let x=18,dir='right',walking=true,frame=0,lastFrame=0,lastTurn=0,speed=26,raf=0,idleDir='front',idleAction='look',idleTimer=0;
  const lines=['Ready?','Keep going!','Nice work!','Study time!','You got this!','Let\'s learn!'];
  const actions=['look','cheer','sit','sleep'];
  function render(){if(!window.SushiAvatar2D)return;char.innerHTML=window.SushiAvatar2D.render(avatar(),{direction:walking?dir:idleDir,frame});}
  function say(text){bubble.textContent=text;bubble.hidden=false;bubble.style.left=Math.max(6,Math.min(innerWidth-180,x-4))+'px';clearTimeout(say._t);say._t=setTimeout(()=>bubble.hidden=true,1800);}
  function clearIdleClass(){char.classList.remove('idle-cheer','idle-sit','idle-sleep','idle-look');}
  function chooseIdle(){
    walking=false;frame=0;
    idleDir=Math.random()<.55?'front':(Math.random()<.5?'back':dir);
    idleAction=actions[Math.floor(Math.random()*actions.length)];
    clearIdleClass();render();requestAnimationFrame(()=>char.classList.add('idle-'+idleAction));
    const wait=idleAction==='sleep'?1900:idleAction==='sit'?1500:900;
    clearTimeout(idleTimer);idleTimer=setTimeout(()=>{clearIdleClass();walking=true;dir=Math.random()<.5?'left':'right';speed=20+Math.random()*16;render();},wait+Math.random()*700);
  }
  function tick(t){
    raf=requestAnimationFrame(tick);const dt=Math.min(.05,(t-(tick.last||t))/1000);tick.last=t;
    const max=Math.max(18,innerWidth-char.offsetWidth-18);
    if(walking){
      x+=(dir==='right'?1:-1)*speed*dt;if(x<=18){x=18;dir='right'}if(x>=max){x=max;dir='left'}char.style.left=x+'px';
      if(t-lastFrame>135){frame=(frame+1)%4;lastFrame=t;render();}
    }
    if(t-lastTurn>4300+Math.random()*2800){lastTurn=t;chooseIdle();if(Math.random()<.55)say(lines[Math.floor(Math.random()*lines.length)]);}
  }
  char.addEventListener('click',()=>location.href='sushigacha/sushi-avatar.html');
  window.addEventListener('resize',()=>{x=Math.min(x,Math.max(18,innerWidth-char.offsetWidth-18))});
  window.addEventListener('storage',e=>{if(e.key===LEDGER)render()});
  window.addEventListener('focus',render);

  (async()=>{try{
    if(typeof window.avatarSVG!=='function')await load('sushigacha/avatar.js?v=20260913-home2');
    await load('sushigacha/avatar-polish.js?v=4');
    await load('sushigacha/avatar-character-2d.js?v=20260913-1');
    await load('sushigacha/avatar-character-2d-v2.js?v=20260913-1');
    render();raf=requestAnimationFrame(tick);
  }catch(e){console.warn('home avatar walker unavailable',e);root.remove();}})();
})();
