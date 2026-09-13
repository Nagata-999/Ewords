'use strict';
(function(){
  const coarse=window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints>0;
  if(!coarse)return;

  let repeatDelay=null, repeatTimer=null, activePointer=null;
  const buttons=[...document.querySelectorAll('.dpad [data-dir]')];

  function stopRepeat(){
    clearTimeout(repeatDelay);
    clearInterval(repeatTimer);
    repeatDelay=repeatTimer=null;
    activePointer=null;
    buttons.forEach(b=>b.classList.remove('mobile-pressed'));
  }

  function canMove(){
    return typeof move==='function' && !document.querySelector('dialog[open]');
  }

  buttons.forEach(btn=>{
    btn.style.touchAction='none';
    const [dx,dy]=btn.dataset.dir.split(',').map(Number);

    btn.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse')return;
      e.preventDefault();
      e.stopImmediatePropagation();
      stopRepeat();
      activePointer=e.pointerId;
      try{btn.setPointerCapture(e.pointerId)}catch{}
      btn.classList.add('mobile-pressed');
      if(canMove())move(dx,dy);

      repeatDelay=setTimeout(()=>{
        repeatTimer=setInterval(()=>{
          if(activePointer===null || !canMove())return;
          if(typeof enemyAdjacent==='function' && enemyAdjacent())return;
          move(dx,dy);
        },90);
      },200);
    },{capture:true,passive:false});

    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>{
      btn.addEventListener(type,e=>{
        if(e.pointerType==='mouse')return;
        e.preventDefault();
        e.stopImmediatePropagation();
        stopRepeat();
      },{capture:true,passive:false});
    });
  });
})();
