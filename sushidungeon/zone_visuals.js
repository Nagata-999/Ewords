'use strict';
(function(){
  function applyZoneVisual(){
    if(typeof game==='undefined'||!game)return;
    const floor=Number(game.floor)||1;
    document.body.classList.toggle('zone-waterway',floor>=11&&floor<=20);
    document.body.classList.toggle('zone-lava',floor>=21&&floor<=30);
  }
  const baseRender=render;
  render=function(){
    applyZoneVisual();
    const r=baseRender.apply(this,arguments);
    applyZoneVisual();
    return r;
  };
  window.addEventListener('DOMContentLoaded',applyZoneVisual);
  window.addEventListener('load',applyZoneVisual);
  window.sushiApplyZoneVisual=applyZoneVisual;
})();
