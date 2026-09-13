'use strict';
(function(){
  let overlay=null;
  let lastFloor='1F';

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

  function showFloor(label){
    const el=ensureOverlay();
    const num=el.querySelector('#floorTransitionNumber');
    if(num)num.textContent=label;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    window.setTimeout(()=>el.classList.remove('show'),1800);
  }

  function watchFloor(){
    const label=document.getElementById('floorLabel');
    if(!label)return;
    lastFloor=label.textContent.trim()||'1F';
    new MutationObserver(()=>{
      const next=label.textContent.trim();
      if(!next||next===lastFloor)return;
      lastFloor=next;
      window.setTimeout(()=>showFloor(next),50);
    }).observe(label,{childList:true,subtree:true,characterData:true});
  }

  window.addEventListener('DOMContentLoaded',()=>{
    ensureOverlay();
    watchFloor();
  });
  window.sushiFloorTransition={show:showFloor};
})();
