'use strict';
(() => {
  if (window.__sushiAvatarWidgetLoaded) return;
  window.__sushiAvatarWidgetLoaded = true;
  const LEDGER='sushitan_login_bonus_v1';
  const ROOT='sushigacha/';

  function load(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  function savedAvatar(){
    try{
      const raw=localStorage.getItem(LEDGER);
      const ledger=raw?JSON.parse(raw):{};
      const old=ledger?.gacha?.avatar||{};
      const a={...DEFAULT_AVATAR,...old};
      if(old.outfit&&!old.top)a.top=old.outfit;
      delete a.outfit;
      return a;
    }catch(_e){return {...DEFAULT_AVATAR};}
  }

  function addStyle(){
    if(document.getElementById('sushiAvatarWidgetStyle'))return;
    const style=document.createElement('style');
    style.id='sushiAvatarWidgetStyle';
    style.textContent=`
      .sushi-avatar-widget{position:fixed;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));z-index:9000;width:104px;height:126px;text-decoration:none;display:block;filter:drop-shadow(0 10px 16px rgba(15,23,42,.24));transition:transform .18s ease,filter .18s ease;isolation:isolate}
      .sushi-avatar-widget:hover{transform:translateY(-4px) scale(1.03);filter:drop-shadow(0 14px 20px rgba(15,23,42,.3))}
      .sushi-avatar-widget:focus-visible{outline:3px solid #fb923c;outline-offset:4px;border-radius:24px}
      .sushi-avatar-widget .saw-bubble{position:absolute;right:72px;bottom:72px;width:max-content;max-width:172px;padding:8px 10px;border-radius:14px 14px 4px 14px;background:rgba(255,255,255,.96);border:1px solid #fed7aa;color:#7c2d12;font:800 11px/1.35 system-ui,-apple-system,'Segoe UI',sans-serif;box-shadow:0 8px 18px rgba(15,23,42,.12);opacity:0;transform:translateY(4px);pointer-events:none;transition:.18s}
      .sushi-avatar-widget:hover .saw-bubble,.sushi-avatar-widget:focus-visible .saw-bubble{opacity:1;transform:none}
      .sushi-avatar-widget .saw-stage{position:absolute;inset:0;overflow:hidden;border-radius:26px;background:radial-gradient(circle at 50% 72%,rgba(251,146,60,.20),transparent 58%)}
      .sushi-avatar-widget svg{position:absolute;width:106px;height:auto;left:-1px;bottom:-10px;display:block}
      .sushi-avatar-widget .saw-badge{position:absolute;right:1px;bottom:1px;width:29px;height:29px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(180deg,#fb923c,#ea580c);color:#fff;font-size:15px;border:2px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.18)}
      @media(max-width:640px){.sushi-avatar-widget{width:78px;height:96px;right:8px;bottom:8px}.sushi-avatar-widget svg{width:80px;bottom:-8px}.sushi-avatar-widget .saw-badge{width:25px;height:25px;font-size:13px}.sushi-avatar-widget .saw-bubble{display:none}}
      @media(prefers-reduced-motion:reduce){.sushi-avatar-widget{transition:none}}
    `;
    document.head.appendChild(style);
  }

  function render(){
    const el=document.getElementById('sushiAvatarWidget');
    if(!el||typeof avatarSVG!=='function')return;
    el.querySelector('.saw-stage').innerHTML=avatarSVG(savedAvatar());
  }

  function mount(){
    if(document.getElementById('sushiAvatarWidget'))return render();
    addStyle();
    const a=document.createElement('a');
    a.id='sushiAvatarWidget';
    a.className='sushi-avatar-widget';
    a.href='sushigacha/sushi-avatar.html';
    a.setAttribute('aria-label','マイアバターを開く');
    a.title='マイアバター';
    a.innerHTML='<span class="saw-bubble">今日のコーデで勉強中！</span><span class="saw-stage" aria-hidden="true"></span><span class="saw-badge" aria-hidden="true">👕</span>';
    document.body.appendChild(a);
    render();
  }

  async function init(){
    try{
      if(typeof window.avatarSVG!=='function')await load(ROOT+'avatar.js?v=20260912-2');
      if(!document.querySelector('script[src*="avatar-polish.js"]'))await load(ROOT+'avatar-polish.js?v=4');
      mount();
      window.addEventListener('storage',e=>{if(e.key===LEDGER)render();});
      window.addEventListener('focus',render);
      window.addEventListener('pageshow',render);
    }catch(e){console.warn('Avatar widget could not load',e);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
