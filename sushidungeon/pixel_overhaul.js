'use strict';
(function(){
  function ensureMapPanel(){
    if(document.querySelector('.pixelMapPanel'))return;
    const app=document.querySelector('.app');if(!app)return;
    const panel=document.createElement('section');panel.className='pixelMapPanel';
    panel.innerHTML='<div class="pixelMapTitle">MAP</div><div class="pixelMap" aria-label="探索マップ"></div><div class="pixelLegend"><span><b class="p"></b>プレイヤー</span><span><b class="e"></b>敵</span><span><b class="i"></b>アイテム</span></div>';
    app.append(panel);
  }
  function paintMap(){
    const box=document.querySelector('.pixelMap');if(!box||!game?.grid)return;
    if(box.children.length!==W*H){box.replaceChildren();for(let i=0;i<W*H;i++)box.append(document.createElement('i'))}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const el=box.children[y*W+x];el.className='';
      const seen=game.seen instanceof Set&&game.seen.has(key(x,y));
      if(seen&&game.grid[y]?.[x])el.classList.add('seen');
    }
    const mark=(x,y,cls)=>{const el=box.children[y*W+x];if(el)el.classList.add(cls)};
    if(game.player)mark(game.player.x,game.player.y,'player');
    for(const e of game.enemies||[])if(e.hp>0&&game.seen?.has(key(e.x,e.y)))mark(e.x,e.y,'enemy');
    for(const i of game.items||[])if(game.seen?.has(key(i.x,i.y)))mark(i.x,i.y,'item');
    if(game.chest&&!game.chest.open&&game.seen?.has(key(game.chest.x,game.chest.y)))mark(game.chest.x,game.chest.y,'item');
  }
  ensureMapPanel();
  const baseRender=window.render;
  if(typeof baseRender==='function')window.render=function(){const out=baseRender.apply(this,arguments);paintMap();return out};
  window.addEventListener('DOMContentLoaded',()=>{ensureMapPanel();paintMap()});
})();
