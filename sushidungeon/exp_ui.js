'use strict';
(function(){
  function ensureExpHud(){
    const level=document.querySelector('.levelBox');
    if(!level||document.getElementById('expHud'))return;
    const hud=document.createElement('div');
    hud.id='expHud';
    hud.className='expHud';
    hud.innerHTML='<span id="expText">EXP 0 / 7</span><i><b id="expBar"></b></i>';
    level.appendChild(hud);
  }
  function paintExp(){
    ensureExpHud();
    if(!game)return;
    const text=document.getElementById('expText'),bar=document.getElementById('expBar');
    if(text)text.textContent=`EXP ${game.exp} / ${game.nextExp}`;
    if(bar)bar.style.width=`${Math.max(0,Math.min(100,game.exp/game.nextExp*100))}%`;
  }
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){const r=baseRender.apply(this,arguments);paintExp();return r};
  window.addEventListener('DOMContentLoaded',paintExp);
})();