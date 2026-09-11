'use strict';
(function(){
  let pendingUntil=0;

  function armWalk(){
    pendingUntil=performance.now()+260;
    requestAnimationFrame(applyWalk);
  }

  function applyWalk(){
    if(performance.now()>pendingUntil)return;
    const p=document.querySelector('#board .entity.player');
    if(!p)return;
    p.classList.remove('walk-visual');
    void p.offsetWidth;
    p.classList.add('walk-visual');
    setTimeout(()=>p.classList.remove('walk-visual'),190);
  }

  function bind(){
    document.querySelectorAll('.dpad button[data-dir]').forEach(btn=>{
      btn.addEventListener('pointerdown',armWalk,{passive:true});
    });
    document.addEventListener('keydown',e=>{
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))armWalk();
    },{passive:true});
    const board=document.getElementById('board');
    if(board){
      board.addEventListener('pointerup',()=>{
        if(performance.now()<=pendingUntil)requestAnimationFrame(applyWalk);
      },{passive:true});
      const obs=new MutationObserver(()=>{
        if(performance.now()<=pendingUntil)requestAnimationFrame(applyWalk);
      });
      obs.observe(board,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
