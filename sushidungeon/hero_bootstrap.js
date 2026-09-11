'use strict';
(function(){
  let done=false;
  function bootHero(){
    if(done)return;
    const p=document.querySelector('#board .entity.player');
    if(!p)return;
    done=true;
    // Repaint once after the async game boot. This does not advance a turn.
    requestAnimationFrame(()=>{
      if(typeof render==='function')render();
    });
  }
  const timer=setInterval(()=>{
    bootHero();
    if(done)clearInterval(timer);
  },25);
  setTimeout(()=>clearInterval(timer),5000);
})();