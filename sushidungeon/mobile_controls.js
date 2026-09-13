'use strict';
(function(){
  const coarse=window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints>0;
  if(!coarse)return;

  let repeatDelay=null, repeatTimer=null, activeButton=null, suppressPointerUntil=0;
  const buttons=[...document.querySelectorAll('.dpad [data-dir]')];

  function stopRepeat(){
    clearTimeout(repeatDelay);
    clearInterval(repeatTimer);
    repeatDelay=repeatTimer=null;
    activeButton=null;
    buttons.forEach(b=>b.classList.remove('mobile-pressed'));
  }

  function canMove(){
    return typeof move==='function' && !document.querySelector('dialog[open]');
  }

  function startMove(btn,dx,dy){
    stopRepeat();
    activeButton=btn;
    btn.classList.add('mobile-pressed');
    if(canMove())move(dx,dy);

    repeatDelay=setTimeout(()=>{
      repeatTimer=setInterval(()=>{
        if(activeButton!==btn || !canMove())return;
        if(typeof enemyAdjacent==='function' && enemyAdjacent())return;
        move(dx,dy);
      },78);
    },165);
  }

  buttons.forEach(btn=>{
    btn.style.touchAction='none';
    btn.style.webkitTapHighlightColor='transparent';
    const [dx,dy]=btn.dataset.dir.split(',').map(Number);

    // iPhone/iPad: touchstart is the earliest reliable event. Move immediately here.
    btn.addEventListener('touchstart',e=>{
      e.preventDefault();
      e.stopImmediatePropagation();
      suppressPointerUntil=performance.now()+500;
      startMove(btn,dx,dy);
    },{capture:true,passive:false});

    ['touchend','touchcancel'].forEach(type=>{
      btn.addEventListener(type,e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        suppressPointerUntil=performance.now()+500;
        stopRepeat();
      },{capture:true,passive:false});
    });

    // Fallback for stylus / touch browsers that do not expose touch events as expected.
    btn.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' || performance.now()<suppressPointerUntil)return;
      e.preventDefault();
      e.stopImmediatePropagation();
      startMove(btn,dx,dy);
    },{capture:true,passive:false});

    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>{
      btn.addEventListener(type,e=>{
        if(e.pointerType==='mouse' || performance.now()<suppressPointerUntil)return;
        e.preventDefault();
        e.stopImmediatePropagation();
        stopRepeat();
      },{capture:true,passive:false});
    });
  });

  window.addEventListener('blur',stopRepeat);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRepeat()});
})();
