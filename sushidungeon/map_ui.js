'use strict';
(function(){
  let dialog,grid;
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='mapDialog';dialog.className='mapDialog';
    dialog.innerHTML='<div class="mapPanel"><header><div><small>DUNGEON MAP</small><h2>全体マップ</h2></div><button type="button" class="mapClose" aria-label="閉じる">×</button></header><div id="fullMapGrid" class="fullMapGrid"></div><footer><span><i class="mapLegend player"></i>現在地</span><span><i class="mapLegend stairs"></i>階段</span><span><i class="mapLegend chest"></i>宝箱</span></footer></div>';
    document.body.append(dialog);grid=dialog.querySelector('#fullMapGrid');
    dialog.querySelector('.mapClose').onclick=()=>dialog.close();
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  }
  function draw(){
    ensure();if(!game||!game.grid)return;
    const h=game.grid.length,w=Math.max(...game.grid.map(r=>r.length));
    grid.style.gridTemplateColumns=`repeat(${w},1fr)`;grid.replaceChildren();
    const seen=game.seen instanceof Set?game.seen:null;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const c=document.createElement('i'),floor=!!game.grid[y]?.[x],known=game.mapReveal||!seen||seen.has(key(x,y));
      c.className='mapCell '+(!known?'unknown':floor?'floor':'wall');
      if(known&&floor){
        if(game.exit&&game.exit.x===x&&game.exit.y===y)c.classList.add('stairs');
        if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.classList.add('chest');
        if(game.items?.some(a=>a.x===x&&a.y===y))c.classList.add('item');
        if(game.enemies?.some(a=>a.hp>0&&a.x===x&&a.y===y))c.classList.add('enemy');
      }
      if(game.player&&game.player.x===x&&game.player.y===y)c.classList.add('player');
      grid.append(c);
    }
  }
  function openMap(){draw();dialog.showModal()}
  window.addEventListener('DOMContentLoaded',()=>{
    ensure();const btn=document.getElementById('mapBtn');if(btn)btn.onclick=openMap;
  });
  window.openDungeonMap=openMap;
})();