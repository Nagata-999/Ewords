'use strict';
(function(){
  function ratSvg(dir){
    const side=dir==='e'||dir==='w';
    if(dir==='n')return `<svg viewBox="0 0 100 100" class="ratSprite"><ellipse cx="50" cy="58" rx="30" ry="25" fill="#796c63"/><circle cx="28" cy="31" r="14" fill="#8d7c70"/><circle cx="72" cy="31" r="14" fill="#8d7c70"/><ellipse cx="50" cy="48" rx="24" ry="24" fill="#85766d"/><path d="M50 62Q43 75 50 88Q57 75 50 62" fill="#5a4d47"/><path d="M29 67Q15 73 9 88M71 67Q85 73 91 88" stroke="#6b5d55" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
    if(side)return `<svg viewBox="0 0 100 100" class="ratSprite ${dir==='w'?'flip':''}"><ellipse cx="46" cy="61" rx="30" ry="22" fill="#796c63"/><circle cx="61" cy="37" r="13" fill="#8d7c70"/><ellipse cx="68" cy="52" rx="22" ry="19" fill="#85766d"/><circle cx="78" cy="49" r="3" fill="#191919"/><path d="M87 57L96 60L88 64Z" fill="#d5968f"/><path d="M18 62Q2 54 5 39" stroke="#957f73" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M38 77L31 91M61 77L66 91" stroke="#62544e" stroke-width="6" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 100 100" class="ratSprite"><ellipse cx="50" cy="62" rx="28" ry="24" fill="#796c63"/><circle cx="27" cy="34" r="14" fill="#8d7c70"/><circle cx="73" cy="34" r="14" fill="#8d7c70"/><ellipse cx="50" cy="50" rx="25" ry="23" fill="#85766d"/><circle cx="41" cy="49" r="4" fill="#191919"/><circle cx="59" cy="49" r="4" fill="#191919"/><ellipse cx="50" cy="61" rx="5" ry="4" fill="#d5968f"/><path d="M45 68Q50 72 55 68" stroke="#594b45" stroke-width="2" fill="none"/><path d="M21 61H40M60 61H79M20 68H40M60 68H80" stroke="#b9a99d" stroke-width="2"/></svg>`;
  }
  function dirFromClass(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's';}
  function refreshEntity(el){
    // Player rendering is owned exclusively by hero_asset_v3.js.
    // Keeping the legacy player renderer here caused old-avatar flashes between frames.
    if(!el.classList.contains('enemy')||el.title!=='洞窟ネズミ')return;
    const dir=dirFromClass(el),sig='r-'+dir;
    if(el.dataset.dirSig===sig)return;
    el.dataset.dirSig=sig;
    const hp=el.querySelector('.enemyHp')?.outerHTML||'';
    el.innerHTML=`<span class="enemyGlyph directionalEnemy">${ratSvg(dir)}</span>${hp}`;
  }
  function refresh(){document.querySelectorAll('.entity.enemy').forEach(refreshEntity);}
  const obs=new MutationObserver(()=>requestAnimationFrame(refresh));
  window.addEventListener('DOMContentLoaded',()=>{const board=document.getElementById('board');if(board)obs.observe(board,{childList:true,subtree:true});refresh();});
})();
