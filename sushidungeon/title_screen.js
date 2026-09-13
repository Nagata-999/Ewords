'use strict';
(function(){
  const SAVE_KEY='sushidungeon_run_save_v1';
  let overlay=null;

  function readSave(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;const data=JSON.parse(raw);if(!data||!data.game||data.game.dead)return null;return data}catch{return null}}
  function writeSave(){try{if(!game||game.dead)return;localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,savedAt:Date.now(),game}));updateContinue()}catch{}}
  function clearSave(){try{localStorage.removeItem(SAVE_KEY)}catch{}updateContinue()}

  function build(){
    if(overlay)return overlay;
    overlay=document.createElement('div');overlay.id='titleScreen';overlay.className='titleScreen';
    overlay.innerHTML=`<div class="titleBackdrop" aria-hidden="true"><span class="titleLantern left">🏮</span><span class="titleLantern right">🏮</span><div class="titleDungeonGlow"></div></div><div class="titlePanel"><div class="titleSushi">🍣</div><p class="titleKicker">SUSHI MYSTERY DUNGEON</p><h1>すしの<br><span>不思議なダンジョン</span></h1><p class="titleTagline">剣と寿司と英単語。30Fを目指せ。</p><div class="titleButtons"><button id="titleNew" type="button" class="titleBtn primary">はじめから</button><button id="titleContinue" type="button" class="titleBtn">つづきから</button></div><p id="titleSaveInfo" class="titleSaveInfo"></p></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#titleNew').addEventListener('click',()=>{clearSave();startGame();writeSave();close()});
    overlay.querySelector('#titleContinue').addEventListener('click',()=>{const save=readSave();if(!save)return;game=save.game;render();close()});
    updateContinue();return overlay;
  }
  function updateContinue(){if(!overlay)return;const save=readSave(),btn=overlay.querySelector('#titleContinue'),info=overlay.querySelector('#titleSaveInfo');btn.disabled=!save;if(!save){info.textContent='セーブデータはありません';return}const g=save.game;info.textContent=`${g.floor}F  /  Lv ${g.level}  /  HP ${Math.max(0,g.hp)}/${g.maxHp}`}
  function open(){build();updateContinue();overlay.classList.remove('closing');overlay.hidden=false;requestAnimationFrame(()=>overlay.classList.add('open'))}
  function close(){if(!overlay)return;overlay.classList.remove('open');overlay.classList.add('closing');setTimeout(()=>{overlay.hidden=true;overlay.classList.remove('closing')},420)}
  function hookSaves(){
    if(typeof endTurn==='function'&&!endTurn.__saveWrapped){const base=endTurn;endTurn=function(){const r=base.apply(this,arguments);writeSave();return r};endTurn.__saveWrapped=true}
    if(typeof descend==='function'&&!descend.__saveWrapped){const base=descend;descend=function(){const r=base.apply(this,arguments);writeSave();return r};descend.__saveWrapped=true}
    if(typeof useItem==='function'&&!useItem.__saveWrapped){const base=useItem;useItem=function(){const r=base.apply(this,arguments);writeSave();return r};useItem.__saveWrapped=true}
    if(typeof die==='function'&&!die.__saveWrapped){const base=die;die=function(){clearSave();return base.apply(this,arguments)};die.__saveWrapped=true}
    if(typeof finishClear==='function'&&!finishClear.__saveWrapped){const base=finishClear;finishClear=function(){clearSave();return base.apply(this,arguments)};finishClear.__saveWrapped=true}
  }
  function init(){build();hookSaves();open()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.sushiTitleScreen={open,close,save:writeSave,clearSave};
})();