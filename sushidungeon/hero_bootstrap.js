'use strict';
(function(){
  function nudge(){
    const p=document.querySelector('#board .entity.player');
    if(!p)return false;
    if(!p.querySelector('.heroAssetV3')){
      p.classList.add('hero-bootstrap-nudge');
      requestAnimationFrame(()=>p.classList.remove('hero-bootstrap-nudge'));
    }
    return true;
  }
  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      nudge();
      if(++tries>40)clearInterval(timer);
    },50);
    const board=document.getElementById('board');
    if(board){
      const obs=new MutationObserver(()=>requestAnimationFrame(nudge));
      obs.observe(board,{childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();