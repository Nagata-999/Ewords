'use strict';
(function(){
  let faceMode=false;
  let holdTimer=0;
  let holdTriggered=false;

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

  // One-thumb Shiren-style control:
  // short tap center = wait one turn; long press center = arm face-only mode;
  // the next direction changes facing without moving or spending a turn.
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

  document.querySelectorAll('[data-dir]').forEach(b=>{
    b.addEventListener('pointerdown',e=>{
      if(!faceMode)return;
      e.preventDefault();e.stopImmediatePropagation();
      const [dx,dy]=b.dataset.dir.split(',').map(Number);
      setFacingOnly(dx,dy);
      leaveFaceMode();
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
