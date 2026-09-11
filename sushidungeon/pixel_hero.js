'use strict';
(function(){
  const NS='http://www.w3.org/2000/svg';
  function addSushiHero(){
    const svg=document.querySelector('#board .entity.player svg');
    if(!svg||svg.querySelector('.sushiHeroHead'))return;
    const g=document.createElementNS(NS,'g');g.setAttribute('class','sushiHeroHead');g.setAttribute('pointer-events','none');
    g.innerHTML=`
      <rect x="55" y="25" width="70" height="61" rx="22" fill="#f5f0df" stroke="#202a2f" stroke-width="5"/>
      <rect x="69" y="50" width="7" height="9" fill="#172027"/><rect x="104" y="50" width="7" height="9" fill="#172027"/>
      <rect x="84" y="68" width="13" height="4" fill="#a45c52"/>
      <path d="M49 34Q58 8 91 10Q124 10 132 34L123 44Q108 37 92 39Q71 43 57 39Z" fill="#ef594d" stroke="#7f2726" stroke-width="5"/>
      <path d="M62 23Q77 15 92 16M87 31Q101 22 116 25" fill="none" stroke="#ffd0bd" stroke-width="5" stroke-linecap="square"/>
      <rect x="53" y="39" width="74" height="7" fill="#d53f3a" opacity=".9"/>
    `;
    svg.append(g);
  }
  const obs=new MutationObserver(()=>requestAnimationFrame(addSushiHero));
  window.addEventListener('DOMContentLoaded',()=>{const b=document.getElementById('board');if(b)obs.observe(b,{childList:true,subtree:true});addSushiHero()});
  setInterval(addSushiHero,160);
})();
