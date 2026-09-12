'use strict';
(function(){
  let mini,miniGrid,dialog,fullGrid,queued=false;
  function buildCell(x,y,seen){
    const c=document.createElement('i'),floor=!!game.grid[y]?.[x],known=game.mapReveal||!seen||seen.has(key(x,y));
    c.className='mapCell '+(!known?'unknown':floor?'floor':'wall');
    if(known&&floor){
      if(game.exit&&game.exit.x===x&&game.exit.y===y)c.classList.add('stairs');
      if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.classList.add('chest');
      if(game.items?.some(a=>a.x===x&&a.y===y))c.classList.add('item');
      if(game.enemies?.some(a=>a.hp>0&&a.x===x&&a.y===y))c.classList.add('enemy');
    }
    if(game.player&&game.player.x===x&&game.player.y===y)c.classList.add('player');
    return c;
  }
  function ensureMini(){
    if(mini)return;
    const wrap=document.getElementById('boardWrap');if(!wrap)return;
    mini=document.createElement('button');mini.id='miniMap';mini.className='miniMap';mini.type='button';mini.setAttribute('aria-label','全体マップを拡大');
    mini.innerHTML='<span class="miniMapTitle">MAP</span><span id="miniMapGrid" class="miniMapGrid"></span>';
    wrap.append(mini);miniGrid=mini.querySelector('#miniMapGrid');mini.onclick=openMap;
  }
  function ensureDialog(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='mapDialog';dialog.className='mapDialog';
    dialog.innerHTML='<div class="mapPanel"><header><div><small>DUNGEON MAP</small><h2>全体マップ</h2></div><button type="button" class="mapClose" aria-label="閉じる">×</button></header><div id="fullMapGrid" class="fullMapGrid"></div><footer><span><i class="mapLegend player"></i>現在地</span><span><i class="mapLegend stairs"></i>階段</span><span><i class="mapLegend chest"></i>宝箱</span></footer></div>';
    document.body.append(dialog);fullGrid=dialog.querySelector('#fullMapGrid');
    dialog.querySelector('.mapClose').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  }
  function paint(grid){
    if(!grid||!game||!game.grid)return;
    const h=game.grid.length,w=Math.max(...game.grid.map(r=>r.length)),seen=game.seen instanceof Set?game.seen:null;
    grid.style.gridTemplateColumns=`repeat(${w},1fr)`;grid.replaceChildren();
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)grid.append(buildCell(x,y,seen));
  }
  function drawMini(){ensureMini();paint(miniGrid)}
  function openMap(){ensureDialog();paint(fullGrid);dialog.showModal()}
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;drawMini()})}
  window.addEventListener('DOMContentLoaded',()=>{
    ensureMini();ensureDialog();drawMini();
    const board=document.getElementById('board');if(board)new MutationObserver(queue).observe(board,{childList:true,subtree:true,characterData:true});
  });
  window.openDungeonMap=openMap;
})();