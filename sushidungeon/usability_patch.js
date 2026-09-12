'use strict';
(function(){
  let faceMode=false;
  let holdTimer=0;
  let holdTriggered=false;
  let moveDelay=0;
  let moveRepeat=0;
  let activeDirButton=null;
  let repeatStarted=false;

  function setFacingOnly(dx,dy){
    if(!game||game.dead||(!dx&&!dy))return;
    playerFacing=facingFrom(dx,dy,playerFacing);
    window.dispatchEvent(new CustomEvent('sushi-facing',{detail:{dx,dy}}));
    render();
  }
  function leaveFaceMode(){
    faceMode=false;
    document.getElementById('waitBtn')?.classList.remove('faceMode');
  }
  function stopMoveRepeat(){
    clearTimeout(moveDelay);clearInterval(moveRepeat);
    moveDelay=0;moveRepeat=0;
    if(activeDirButton)activeDirButton.classList.remove('dirPressed');
    activeDirButton=null;
  }

  // Board tap: face toward the tapped side without consuming a turn.
  const board=document.getElementById('boardWrap');
  if(board){
    let sx=0,sy=0,armed=false;
    board.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;armed=true},{passive:true});
    board.addEventListener('pointerup',e=>{
      if(!armed)return;armed=false;
      if(Math.hypot(e.clientX-sx,e.clientY-sy)>=18)return;
      const r=board.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const rx=e.clientX-cx,ry=e.clientY-cy;
      if(Math.hypot(rx,ry)<22)return;
      const dx=Math.abs(rx)>18?Math.sign(rx):0,dy=Math.abs(ry)>18?Math.sign(ry):0;
      setFacingOnly(dx,dy);
    },{passive:true});
  }

  // Center button: tap = wait one turn, long press = face-only mode.
  const wait=document.getElementById('waitBtn');
  if(wait){
    wait.textContent='向';
    wait.title='タップ: 1ターン待機 / 長押し: 次の方向入力で向き変更';
    wait.addEventListener('pointerdown',e=>{
      e.preventDefault();
      holdTriggered=false;
      clearTimeout(holdTimer);
      holdTimer=setTimeout(()=>{
        holdTriggered=true;faceMode=true;wait.classList.add('faceMode');
        if(typeof msg==='function')msg('向き変更：方向をタップ');
      },220);
    },true);
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>wait.addEventListener(ev,()=>clearTimeout(holdTimer),true));
    wait.addEventListener('click',e=>{
      if(holdTriggered){e.preventDefault();e.stopImmediatePropagation();holdTriggered=false;return;}
      if(faceMode){e.preventDefault();e.stopImmediatePropagation();leaveFaceMode();}
    },true);
  }

  // Direction input polish:
  // - tap moves on release, not on initial touch
  // - hold waits 300ms, then repeats every 150ms
  // - sliding off the button cancels the input
  document.querySelectorAll('[data-dir]').forEach(b=>{
    const [dx,dy]=b.dataset.dir.split(',').map(Number);

    b.addEventListener('pointerdown',e=>{
      e.preventDefault();e.stopImmediatePropagation();
      stopMoveRepeat();

      if(faceMode){
        setFacingOnly(dx,dy);
        leaveFaceMode();
        return;
      }

      activeDirButton=b;repeatStarted=false;b.classList.add('dirPressed');
      moveDelay=setTimeout(()=>{
        if(activeDirButton!==b||!game||game.dead)return;
        repeatStarted=true;
        if(!enemyAdjacent())move(dx,dy);
        moveRepeat=setInterval(()=>{
          if(activeDirButton!==b||!game||game.dead||enemyAdjacent())return;
          move(dx,dy);
        },150);
      },300);
    },true);

    b.addEventListener('pointerup',e=>{
      if(activeDirButton!==b)return;
      e.preventDefault();e.stopImmediatePropagation();
      const shouldTapMove=!repeatStarted;
      stopMoveRepeat();
      if(shouldTapMove&&game&&!game.dead)move(dx,dy);
    },true);

    b.addEventListener('pointercancel',e=>{
      if(activeDirButton!==b)return;
      e.preventDefault();e.stopImmediatePropagation();stopMoveRepeat();
    },true);

    b.addEventListener('pointerleave',e=>{
      if(activeDirButton!==b)return;
      e.preventDefault();e.stopImmediatePropagation();stopMoveRepeat();
    },true);
  });

  document.addEventListener('keydown',e=>{
    if(!e.shiftKey)return;
    const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
    const d=m[e.key];if(!d)return;
    e.preventDefault();e.stopImmediatePropagation();setFacingOnly(d[0],d[1]);
  },true);

  const baseRenderInventory=renderInventory;
  renderInventory=function(){
    baseRenderInventory();
    const buttons=[...document.querySelectorAll('#inventoryList > button')];
    buttons.forEach((b,i)=>{
      const it=game?.inventory?.[i];if(!it)return;
      const equipped=it===game.weapon||it===game.shield||it===game.accessory;
      b.classList.toggle('equippedItem',equipped);
      if(equipped){
        const badge=document.createElement('em');badge.className='equipBadge';badge.textContent='E';badge.setAttribute('aria-label','装備中');b.prepend(badge);
      }
    });
  };
})();
