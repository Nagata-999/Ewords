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
    #homeAvatarWalker{position:fixed;left:0;right:0;bottom:4px;height:118px;z-index:7;pointer-events:none;overflow:visible}
    #homeAvatarWalker .home-avatar-char{position:absolute;left:18px;bottom:0;width:86px;height:108px;border:0;background:transparent;padding:0;pointer-events:auto;cursor:pointer;transition:left .08s linear;filter:drop-shadow(0 5px 4px rgba(15,23,42,.18))}
    #homeAvatarWalker .home-avatar-char svg{width:100%;height:100%;display:block;overflow:visible}
    #homeAvatarWalker .home-avatar-bubble{position:absolute;bottom:98px;min-width:90px;max-width:160px;padding:7px 10px;border-radius:13px;background:#fffaf2;border:1px solid #fed7aa;color:#7c2d12;font-size:11px;font-weight:900;text-align:center;box-shadow:0 6px 16px rgba(15,23,42,.12);pointer-events:none;white-space:nowrap}
    #homeAvatarWalker .home-avatar-bubble:after{content:"";position:absolute;left:22px;bottom:-7px;border:7px solid transparent;border-top-color:#fed7aa}
    @media(max-width:560px){#homeAvatarWalker{height:100px}#homeAvatarWalker .home-avatar-char{width:72px;height:92px}#homeAvatarWalker .home-avatar-bubble{bottom:84px}}
  `;
  document.head.appendChild(st);

  function load(src){return new Promise((res,rej)=>{if([...document.scripts].some(s=>s.src.includes(src.split('?')[0])))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
  function avatar(){try{const l=JSON.parse(localStorage.getItem(LEDGER)||'{}');const a={...(window.DEFAULT_AVATAR||{}),...(l?.gacha?.avatar||{})};if(!a.top&&a.outfit)a.top=a.outfit;return a;}catch(_e){return {...(window.DEFAULT_AVATAR||{})};}}

  let x=18,dir='right',walking=true,frame=0,lastFrame=0,lastTurn=0,speed=24,raf=0;
  function render(){if(!window.SushiAvatar2D)return;char.innerHTML=window.SushiAvatar2D.render(avatar(),{direction:walking?dir:(Math.random()<.15?'back':'front'),frame});}
  function say(text){bubble.textContent=text;bubble.hidden=false;bubble.style.left=Math.max(6,Math.min(innerWidth-170,x-4))+'px';clearTimeout(say._t);say._t=setTimeout(()=>bubble.hidden=true,1800);}
  function chooseIdle(){walking=false;render();setTimeout(()=>{walking=true;dir=Math.random()<.5?'left':'right';speed=18+Math.random()*16;render();},900+Math.random()*1700);}
  function tick(t){raf=requestAnimationFrame(tick);const dt=Math.min(.05,(t-(tick.last||t))/1000);tick.last=t;
    const max=Math.max(18,innerWidth-char.offsetWidth-18);
    if(walking){x+=(dir==='right'?1:-1)*speed*dt;if(x<=18){x=18;dir='right'}if(x>=max){x=max;dir='left'}char.style.left=x+'px';if(t-lastFrame>220){frame=1-frame;lastFrame=t;render();}}
    if(t-lastTurn>5000+Math.random()*3500){lastTurn=t;chooseIdle();if(Math.random()<.45)say(['Ready?','Keep going!','Nice work!','Study time!'][Math.floor(Math.random()*4)]);}
  }
  char.addEventListener('click',()=>location.href='sushigacha/sushi-avatar.html');
  window.addEventListener('resize',()=>{x=Math.min(x,innerWidth-char.offsetWidth-18)});
  window.addEventListener('storage',e=>{if(e.key===LEDGER)render()});
  window.addEventListener('focus',render);

  (async()=>{try{if(typeof window.avatarSVG!=='function')await load('sushigacha/avatar.js?v=20260913-home1');await load('sushigacha/avatar-polish.js?v=4');await load('sushigacha/avatar-character-2d.js?v=20260913-1');render();raf=requestAnimationFrame(tick);}catch(e){console.warn('home avatar walker unavailable',e);root.remove();}})();
})();
