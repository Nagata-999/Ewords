'use strict';
(function(){
  let overlay=null;
  let active=false;

  function ensureOverlay(){
    if(overlay)return overlay;
    overlay=document.createElement('div');
    overlay.id='floorTransition';
    overlay.className='floorTransition';
    overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="floorTransitionShade"></div><div class="floorTransitionText"><span class="floorTransitionLabel">DESCEND</span><strong id="floorTransitionNumber">1F</strong></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function showFloor(floor){
    const el=ensureOverlay();
    const num=el.querySelector('#floorTransitionNumber');
    if(num)num.textContent=`${floor}F`;
    active=true;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    window.setTimeout(()=>{
      el.classList.remove('show');
      active=false;
    },1800);
  }

  function wrapDescend(){
    if(typeof window.descend!=='function' || window.descend.__floorTransitionWrapped)return;
    const base=window.descend;
    const wrapped=function(){
      const before=window.game?.floor;
      const result=base.apply(this,arguments);
      const after=window.game?.floor;
      if(after && after!==before)window.setTimeout(()=>showFloor(after),40);
      return result;
    };
    wrapped.__floorTransitionWrapped=true;
    window.descend=wrapped;
  }

  window.addEventListener('DOMContentLoaded',()=>{
    ensureOverlay();
    wrapDescend();
  });
  window.addEventListener('load',wrapDescend);
  window.sushiFloorTransition={show:showFloor,get active(){return active;}};
})();
