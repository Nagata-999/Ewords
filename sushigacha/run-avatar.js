'use strict';
(() => {
  const LEDGER='sushitan_login_bonus_v1';
  const player=document.getElementById('player');
  if(!player) return;

  function loadScript(src){
    return new Promise((resolve,reject)=>{
      if([...document.scripts].some(s=>s.src.includes(src.split('?')[0]))) return resolve();
      const s=document.createElement('script');
      s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }

  function readAvatar(){
    try{
      const raw=localStorage.getItem(LEDGER);
      const ledger=raw?JSON.parse(raw):{};
      const a={...(window.DEFAULT_AVATAR||{}),...(ledger?.gacha?.avatar||{})};
      if(!a.top&&a.outfit)a.top=a.outfit;
      return a;
    }catch(_e){return {...(window.DEFAULT_AVATAR||{})};}
  }

  function installCss(){
    if(document.getElementById('sushiRunAvatarCss')) return;
    const style=document.createElement('style');
    style.id='sushiRunAvatarCss';
    style.textContent=`
      #player.sushi-avatar-runner{background-image:none!important;background-color:transparent!important;overflow:visible!important;border-radius:0!important;}
      #player.sushi-avatar-runner .run-avatar-wrap{position:absolute;left:50%;bottom:-2px;width:86px;height:112px;transform:translateX(-50%);transform-origin:50% 100%;pointer-events:none;filter:drop-shadow(0 5px 4px rgba(0,0,0,.28));}
      #player.sushi-avatar-runner .run-avatar-wrap svg{width:100%;height:100%;display:block;overflow:visible;}
      #player.sushi-avatar-runner.run-step-a .run-avatar-wrap{transform:translateX(-50%) translateY(-2px) rotate(-2deg) scaleY(.99);}
      #player.sushi-avatar-runner.run-step-b .run-avatar-wrap{transform:translateX(-50%) translateY(1px) rotate(2deg) scaleY(1.01);}
      #player.sushi-avatar-runner.run-miss .run-avatar-wrap{animation:runAvatarMiss .34s ease both;}
      #player.sushi-avatar-runner.dash .run-avatar-wrap{animation:runAvatarDash .18s ease both;}
      @keyframes runAvatarMiss{0%{transform:translateX(-50%) rotate(0)}35%{transform:translateX(-50%) rotate(-13deg) translateY(5px)}70%{transform:translateX(-50%) rotate(9deg) translateY(2px)}100%{transform:translateX(-50%) rotate(0)}}
      @keyframes runAvatarDash{0%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.16) translateY(-5px)}100%{transform:translateX(-50%) scale(1)}}
      @media (max-width:700px){#player.sushi-avatar-runner .run-avatar-wrap{width:78px;height:102px;bottom:-1px;}}
    `;
    document.head.appendChild(style);
  }

  function render(){
    if(typeof window.avatarSVG!=='function') return;
    player.classList.add('sushi-avatar-runner');
    player.style.backgroundImage='none';
    player.innerHTML=`<div class="run-avatar-wrap">${window.avatarSVG(readAvatar())}</div>`;
  }

  async function init(){
    installCss();
    try{
      if(typeof window.avatarSVG!=='function') await loadScript('sushigacha/avatar.js?v=20260913-run2');
      await loadScript('sushigacha/avatar-polish.js?v=20260913-4');
      await loadScript('sushigacha/avatar-modern.js?v=20260913-1');
    }catch(_e){}
    render();

    let frame=0;
    const originalSetPlayerBg=window.setPlayerBg;
    if(typeof originalSetPlayerBg==='function'){
      window.setPlayerBg=function(src){
        if(!player.classList.contains('sushi-avatar-runner')) return originalSetPlayerBg(src);
        const miss=String(src||'').includes('miss');
        player.classList.toggle('run-miss',miss);
        if(!miss){
          frame++;
          player.classList.toggle('run-step-a',frame%2===0);
          player.classList.toggle('run-step-b',frame%2!==0);
        }
        player.style.backgroundImage='none';
      };
    }
  }

  window.addEventListener('storage',e=>{if(e.key===LEDGER)render();});
  window.addEventListener('focus',render);
  window.addEventListener('pageshow',render);
  init();
})();
