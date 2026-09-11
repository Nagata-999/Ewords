'use strict';
(function(){
  function canInput(){
    if(!game||game.dead)return false;
    const ids=['wordDialog','inventoryDialog','stairsDialog','keepDialog','gameOverDialog','logDialog'];
    return !ids.some(id=>{const d=document.getElementById(id);return d&&d.open});
  }

  function animatePlayerFrom(oldRect){
    requestAnimationFrame(()=>{
      const el=document.querySelector('#board .entity.player');
      if(!el||!oldRect)return;
      const nr=el.getBoundingClientRect();
      const dx=oldRect.left-nr.left,dy=oldRect.top-nr.top;
      if(Math.abs(dx)>2||Math.abs(dy)>2){
        try{el.animate([
          {transform:`translate(${dx}px,${dy}px)`,offset:0},
          {transform:`translate(${dx*.42}px,${dy*.42-3}px)`,offset:.55},
          {transform:'translate(0,0)',offset:1}
        ],{duration:145,easing:'steps(4,end)'});}catch{}
      }
    });
  }

  function repairedMove(dx,dy){
    if(!canInput())return;
    if(typeof BASE_MOVE!=='function')return;
    const oldEl=document.querySelector('#board .entity.player');
    const oldRect=oldEl?oldEl.getBoundingClientRect():null;
    const before=game&&game.player?{x:game.player.x,y:game.player.y}:null;

    if(typeof facingFrom==='function')playerFacing=facingFrom(dx,dy,playerFacing||'s');
    BASE_MOVE(dx,dy);

    if(!before||!game||game.dead)return;
    const moved=before.x!==game.player.x||before.y!==game.player.y;
    if(moved){
      if(typeof followCamera==='function')followCamera();
      playerMotion='walk';
      render();
      animatePlayerFrom(oldRect);
      clearTimeout(repairedMove.idleTimer);
      repairedMove.idleTimer=setTimeout(()=>{
        if(game&&!game.dead){playerMotion='idle';render()}
      },170);
    }else{
      render();
    }
  }

  function replaceDirButtons(){
    document.querySelectorAll('[data-dir]').forEach(old=>{
      const b=old.cloneNode(true);old.replaceWith(b);
      const [dx,dy]=b.dataset.dir.split(',').map(Number);
      let repeatDelay=null,repeatTimer=null;
      const stop=()=>{clearTimeout(repeatDelay);clearInterval(repeatTimer);repeatDelay=repeatTimer=null};
      b.addEventListener('pointerdown',e=>{
        e.preventDefault();
        try{b.setPointerCapture(e.pointerId)}catch{}
        repairedMove(dx,dy);
        stop();
        repeatDelay=setTimeout(()=>{
          repeatTimer=setInterval(()=>{
            if(canInput()&&!(typeof enemyAdjacent==='function'&&enemyAdjacent()))repairedMove(dx,dy);
          },135);
        },340);
      });
      ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,stop));
    });
  }

  function repairWait(){
    const old=document.getElementById('waitBtn');if(!old)return;
    const b=old.cloneNode(true);old.replaceWith(b);
    b.addEventListener('click',()=>{if(canInput()){endTurn();render()}});
  }

  function repairSwipe(){
    const wrap=document.getElementById('boardWrap');if(!wrap)return;
    let sx=0,sy=0,pid=null;
    wrap.addEventListener('pointerdown',e=>{
      if(!canInput())return;
      sx=e.clientX;sy=e.clientY;pid=e.pointerId;
      e.stopImmediatePropagation();
    },true);
    wrap.addEventListener('pointerup',e=>{
      if(pid!==e.pointerId)return;
      e.stopImmediatePropagation();pid=null;
      const x=e.clientX-sx,y=e.clientY-sy;
      if(Math.hypot(x,y)<22)return;
      repairedMove(Math.abs(x)>18?Math.sign(x):0,Math.abs(y)>18?Math.sign(y):0);
    },true);
  }

  function boot(){replaceDirButtons();repairWait();repairSwipe();window.sushiDungeonMove=repairedMove}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();