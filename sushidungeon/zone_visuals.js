'use strict';
(function(){
  function applyZoneVisual(){
    if(!window.game)return;
    const waterway=game.floor>=11&&game.floor<=20;
    const lava=game.floor>=21&&game.floor<=30;
    document.body.classList.toggle('zone-waterway',waterway);
    document.body.classList.toggle('zone-lava',lava);
  }
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){applyZoneVisual();return baseRender.apply(this,arguments)};
  window.addEventListener('DOMContentLoaded',applyZoneVisual);
  window.sushiApplyZoneVisual=applyZoneVisual;
})();
