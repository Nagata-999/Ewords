'use strict';
(function(){
  function facing(el){for(const d of ['n','e','s','w'])if(el.classList.contains('facing-'+d))return d;return 's'}
  function eye(x,y){return `<ellipse cx="${x}" cy="${y}" rx="4" ry="6" fill="#06141c"/><circle cx="${x-1}" cy="${y-2}" r="1.4" fill="#e9fbff"/>`}
  function art(d){
    let body='';
    if(d==='n')body=`<ellipse cx="50" cy="89" rx="41" ry="7" fill="#0d668f" opacity=".7"/><path d="M7 85Q12 29 50 16Q88 29 93 85Q76 97 50 94Q24 97 7 85Z" fill="#27b9f3" stroke="#074d78" stroke-width="5"/><path d="M23 42Q39 23 61 26" fill="none" stroke="#ddf9ff" stroke-width="8" stroke-linecap="round" opacity=".9"/><circle cx="72" cy="49" r="8" fill="#1686bd"/><circle cx="31" cy="66" r="5" fill="#62d8ff" opacity=".55"/>`;
    else if(d==='e')body=`<ellipse cx="48" cy="89" rx="42" ry="7" fill="#0d668f" opacity=".7"/><path d="M5 85Q10 39 44 19Q77 20 94 61Q99 80 83 90Q47 98 5 85Z" fill="#27b9f3" stroke="#074d78" stroke-width="5"/><path d="M26 39Q43 22 62 27" fill="none" stroke="#ddf9ff" stroke-width="8" stroke-linecap="round"/>${eye(78,57)}<path d="M72 73Q80 81 89 71" fill="#11749e" stroke="#07506f" stroke-width="3"/>`;
    else if(d==='w')body=`<ellipse cx="52" cy="89" rx="42" ry="7" fill="#0d668f" opacity=".7"/><path d="M95 85Q90 39 56 19Q23 20 6 61Q1 80 17 90Q53 98 95 85Z" fill="#27b9f3" stroke="#074d78" stroke-width="5"/><path d="M74 39Q57 22 38 27" fill="none" stroke="#ddf9ff" stroke-width="8" stroke-linecap="round"/>${eye(22,57)}<path d="M28 73Q20 81 11 71" fill="#11749e" stroke="#07506f" stroke-width="3"/>`;
    else body=`<ellipse cx="50" cy="89" rx="42" ry="7" fill="#0d668f" opacity=".7"/><path d="M5 85Q11 30 50 17Q89 30 95 85Q77 97 50 94Q23 97 5 85Z" fill="#27b9f3" stroke="#074d78" stroke-width="5"/><path d="M22 41Q37 22 58 26" fill="none" stroke="#ddf9ff" stroke-width="8" stroke-linecap="round"/>${eye(35,58)}${eye(65,58)}<path d="M34 74Q50 86 66 74" fill="#11749e" stroke="#07506f" stroke-width="3"/>`;
    return `<svg viewBox="0 0 100 100" class="giantSlimeSvg" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${body}</svg>`
  }
  function paint(el){
    if(!el||el.title!=='巨大水スライム')return;
    const d=facing(el),sig='giant-slime-'+d;
    if(el.dataset.giantSlimeSprite===sig)return;
    el.dataset.giantSlimeSprite=sig;
    const hp=el.querySelector('.enemyHp')?.outerHTML||'';
    el.innerHTML=`<span class="enemyGlyph directionalEnemy giantWaterSlime">${art(d)}</span>${hp}`;
  }
  function paintAll(){document.querySelectorAll('.entity.enemy[title="巨大水スライム"]').forEach(paint)}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;paintAll()})}
  const obs=new MutationObserver(queue);
  window.addEventListener('DOMContentLoaded',()=>{const board=document.getElementById('board');if(board)obs.observe(board,{childList:true,subtree:true,attributes:true,attributeFilter:['class','title']});paintAll()});
})();