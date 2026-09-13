'use strict';
(function(){
  let mini,miniGrid,dialog,fullGrid,queued=false;
  function isVisibleNow(x,y){
    try{
      if(typeof window.sushiDungeonVisibleNow==='function')return !!window.sushiDungeonVisibleNow(x,y);
      return typeof visibleNow==='function'&&!!visibleNow(x,y);
    }catch{return false}
  }
  function buildCell(x,y,seen,mode){
    const c=document.createElement('i'),floor=!!game.grid[y]?.[x],known=game.mapReveal||!seen||seen.has(key(x,y)),current=known&&isVisibleNow(x,y);
    c.className='mapCell '+(!known?'unknown':floor?'floor':'wall');
    if(known)c.classList.add(current?'current':'explored');
    if(mode==='mini'){
      if(!known)c.style.background='#05080b';
      else if(current)c.style.background=floor?'#63cfff':'#3f7898';
      else c.style.background=floor?'#ffd866':'#b58a2f';
    }else{
      if(!known)c.style.background='#0a1722';
      else if(current)c.style.background=floor?'#91d8ff':'#5b96ba';
      else c.style.background=floor?'#ffe58a':'#c49a3a';
    }
    if(known&&floor){
      if(game.exit&&game.exit.x===x&&game.exit.y===y)c.classList.add('stairs');
      if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.classList.add('chest');
      if(game.items?.some(a=>a.x===x&&a.y===y))c.classList.add('item');
      if(game.enemies?.some(a=>a.hp>0&&a.x===x&&a.y===y))c.classList.add('enemy');
    }
    if(game.player&&game.player.x===x&&game.player.y===y){c.classList.add('player');c.style.background='#f1d55d'}
    return c;
  }
  function ensureMini(){if(mini)return;const wrap=document.getElementById('boardWrap');if(!wrap)return;mini=document.createElement('button');mini.id='miniMap';mini.className='miniMap';mini.type='button';mini.setAttribute('aria-label','全体マップを拡大');mini.innerHTML='<span class="miniMapTitle">MAP</span><span id="miniMapGrid" class="miniMapGrid"></span>';wrap.append(mini);miniGrid=mini.querySelector('#miniMapGrid');mini.onclick=openMap}
  function ensureDialog(){if(dialog)return;dialog=document.createElement('dialog');dialog.id='mapDialog';dialog.className='mapDialog';dialog.innerHTML='<div class="mapPanel"><header><div><small>DUNGEON MAP</small><h2>全体マップ</h2></div><button type="button" class="mapClose" aria-label="閉じる">×</button></header><div id="fullMapGrid" class="fullMapGrid"></div><footer><span><i class="mapLegend current"></i>現在視界</span><span><i class="mapLegend explored"></i>探索済み</span><span><i class="mapLegend unknown"></i>未探索</span><span><i class="mapLegend player"></i>現在地</span><span><i class="mapLegend stairs"></i>階段</span><span><i class="mapLegend chest"></i>宝箱</span></footer></div>';document.body.append(dialog);fullGrid=dialog.querySelector('#fullMapGrid');dialog.querySelector('.mapClose').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()})}
  function paint(grid,mode){if(!grid||!game||!game.grid)return;const h=game.grid.length,w=Math.max(...game.grid.map(r=>r.length)),seen=game.seen instanceof Set?game.seen:null;grid.style.gridTemplateColumns=`repeat(${w},1fr)`;grid.replaceChildren();for(let y=0;y<h;y++)for(let x=0;x<w;x++)grid.append(buildCell(x,y,seen,mode))}
  function drawMini(){ensureMini();paint(miniGrid,'mini')}
  function openMap(){ensureDialog();paint(fullGrid,'full');dialog.showModal()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;drawMini()})}
  window.addEventListener('DOMContentLoaded',()=>{ensureMini();ensureDialog();drawMini();const board=document.getElementById('board');if(board)new MutationObserver(queue).observe(board,{childList:true,subtree:true,characterData:true})});
  window.openDungeonMap=openMap;
})();
