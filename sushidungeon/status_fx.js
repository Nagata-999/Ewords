'use strict';
(function(){
  let lastFloor=null;
  let lastHunger=null;
  const seenExitByFloor=new Set();
  let raf=0;

  function currentGame(){
    try{return typeof game!=='undefined'?game:null}catch{return null}
  }

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

  function hungerWarning(g){
    const hunger=Math.max(0,Number(g.hunger)||0);
    if(lastHunger===null){lastHunger=hunger;return}
    if(hunger>lastHunger){lastHunger=hunger;return}
    const warnings=[
      [20,'お腹が空いてきた。'],
      [10,'はらぺこだ。'],
      [5,'お腹が空いて死にそうだ。'],
      [0,'もうダメだ。']
    ];
    for(const [threshold,text] of warnings){
      if(lastHunger>threshold&&hunger<=threshold){
        try{if(typeof msg==='function')msg(text);else document.getElementById('message').textContent=text}catch{}
        if(threshold<=5)try{navigator.vibrate?.(threshold===0?[30,45,60]:[22,35,22])}catch{}
      }
    }
    lastHunger=hunger;
  }

  function update(){
    raf=0;
    const g=currentGame();
    if(!g||g.dead)return;
    const hud=document.querySelector('.gameHud');
    const hpGauge=document.querySelector('.hpGauge');
    const hungerGauge=document.querySelector('.hungerGauge');
    const wrap=document.getElementById('boardWrap');
    const ratio=g.maxHp?g.hp/g.maxHp:1;
    const low=ratio<=.28;
    const starving=(Number(g.hunger)||0)<=0;
    hud?.classList.toggle('fxDanger',low);
    hpGauge?.classList.toggle('fxLow',low);
    hungerGauge?.classList.toggle('fxHungry',(Number(g.hunger)||0)<=20);
    wrap?.classList.toggle('fxLowHp',low);
    document.body.classList.toggle('fxStarving',starving);
    hungerWarning(g);

    if(lastFloor!==g.floor){lastFloor=g.floor;}
    const exitCell=document.querySelector('#board .cell.exit');
    if(exitCell)pulseStairs(exitCell,g.floor);
  }

  function schedule(){if(!raf)raf=requestAnimationFrame(update)}

  document.addEventListener('DOMContentLoaded',()=>{
    const board=document.getElementById('board');
    if(board){
      const observer=new MutationObserver(schedule);
      observer.observe(board,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    }
    for(const id of ['hpLabel','hungerLabel']){
      const el=document.getElementById(id);
      if(el){
        const observer=new MutationObserver(schedule);
        observer.observe(el,{subtree:true,childList:true,characterData:true});
      }
    }
    schedule();
  },{once:true});
})();
