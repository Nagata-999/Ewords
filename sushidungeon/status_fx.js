'use strict';
(function(){
  let lastFloor=null;
  const seenExitByFloor=new Set();
  let raf=0;

  function pulseStairs(exitCell,floor){
    const wrap=document.getElementById('boardWrap');
    if(!wrap||!exitCell)return;
    const key=String(floor||'?');
    if(seenExitByFloor.has(key))return;
    seenExitByFloor.add(key);
    exitCell.classList.add('fxDiscovered');
    wrap.classList.remove('fxStairsFound');
    void wrap.offsetWidth;
    wrap.classList.add('fxStairsFound');
    try{navigator.vibrate?.([12,35,12])}catch{}
    if(window.sushiDungeonFx?.ringAt)window.sushiDungeonFx.ringAt(exitCell,'level');
    setTimeout(()=>{
      exitCell.classList.remove('fxDiscovered');
      wrap.classList.remove('fxStairsFound');
    },950);
  }

  function update(){
    raf=0;
    if(!window.game||game.dead)return;
    const hud=document.querySelector('.gameHud');
    const hpGauge=document.querySelector('.hpGauge');
    const wrap=document.getElementById('boardWrap');
    const ratio=game.maxHp?game.hp/game.maxHp:1;
    const low=ratio<=.28;
    hud?.classList.toggle('fxDanger',low);
    hpGauge?.classList.toggle('fxLow',low);
    wrap?.classList.toggle('fxLowHp',low);

    if(lastFloor!==game.floor){lastFloor=game.floor;}
    const exitCell=document.querySelector('#board .cell.exit');
    if(exitCell)pulseStairs(exitCell,game.floor);
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(update)}

  document.addEventListener('DOMContentLoaded',()=>{
    const board=document.getElementById('board');
    if(board){
      const observer=new MutationObserver(schedule);
      observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    }
    const hp=document.getElementById('hpLabel');
    if(hp){
      const observer=new MutationObserver(schedule);
      observer.observe(hp,{subtree:true,childList:true,characterData:true});
    }
    schedule();
  },{once:true});
})();
