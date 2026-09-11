'use strict';
(function(){
  function applyHero(){
    const players=document.querySelectorAll('#board .entity.player');
    if(!players.length)return false;
    players.forEach(el=>{
      if(el.querySelector('.heroAssetV3'))return;
      const fallback=document.querySelector('#heroAssetTemplate img.heroAssetV3');
      if(fallback)el.replaceChildren(fallback.cloneNode(true));
    });
    return true;
  }
  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      applyHero();
      if(++tries>40)clearInterval(timer);
    },50);
    const board=document.getElementById('board');
    if(board){
      const obs=new MutationObserver(()=>requestAnimationFrame(applyHero));
      obs.observe(board,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();