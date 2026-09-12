'use strict';
(function(){
  const RANGE=7;
  const DIR_FROM_CLASS={
    'facing-n':[0,-1],'facing-ne':[1,-1],'facing-e':[1,0],'facing-se':[1,1],
    'facing-s':[0,1],'facing-sw':[-1,1],'facing-w':[-1,0],'facing-nw':[-1,-1]
  };
  let arrows=0;
  let facing=[0,1];

  function button(){return document.getElementById('arrowBtn')}
  function sync(){
    if(game&&Number.isFinite(game.arrows))arrows=game.arrows;
    const b=button();if(!b)return;
    b.disabled=!game||game.dead||arrows<=0;
    b.innerHTML=`<span>➶</span><b>矢 ${arrows}</b>`;
  }
  function setCount(n){arrows=Math.max(0,n|0);if(game)game.arrows=arrows;sync()}
  function learnFacing(){
    const p=document.querySelector('#board .entity.player');if(!p)return;
    for(const [c,d] of Object.entries(DIR_FROM_CLASS))if(p.classList.contains(c)){facing=d;break}
  }
  function enemyAt(x,y){return game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y)}
  function shoot(){
    if(!game||game.dead||arrows<=0)return;
    learnFacing();
    const [dx,dy]=facing;if(!dx&&!dy)return;
    setCount(arrows-1);
    let x=game.player.x,y=game.player.y,hit=null;
    for(let i=0;i<RANGE;i++){
      x+=dx;y+=dy;
      if(x<0||y<0||x>=W||y>=H||!game.grid[y]?.[x])break;
      hit=enemyAt(x,y);if(hit)break;
    }
    if(hit){
      const dmg=4+Math.floor(game.level*.7)+rnd(3);
      hit.hp-=dmg;
      msg(`➶ ${hit.name}に${dmg}ダメージ。`);
      if(hit.hp<=0){
        game.exp+=hit.exp;log(`${hit.name}を矢で倒した。`);
        while(game.exp>=game.nextExp){game.exp-=game.nextExp;game.level++;game.nextExp=Math.floor(game.nextExp*1.45)+3;game.maxHp+=4;game.hp=game.maxHp;msg(`レベル${game.level}！ HP全回復。`);log(`Lv ${game.level}になった。`)}
      }
    }else msg('➶ 矢は暗闇へ飛んでいった。');
    endTurn();
  }

  // Arrows are ammunition, not inventory slots. Each bundle adds 3–6 shots.
  const oldPickup=window.pickup;
  if(typeof oldPickup==='function')window.pickup=function(){
    const i=game?.items?.findIndex(it=>it.x===game.player.x&&it.y===game.player.y&&it.type==='arrow');
    if(i>=0){const it=game.items.splice(i,1)[0];setCount(arrows+(it.value||3));msg(`➶ 矢を${it.value||3}本拾った。`);log(`矢 +${it.value||3}`);return}
    return oldPickup();
  };

  // Add arrow bundles to some floors without replacing the scarce normal loot.
  const oldGenerate=window.generateFloor;
  if(typeof oldGenerate==='function')window.generateFloor=function(){
    oldGenerate();
    if(!game||Math.random()>=.58)return;
    const occupied=new Set([key(game.player.x,game.player.y),key(game.exit.x,game.exit.y),...game.items.map(i=>key(i.x,i.y)),...game.enemies.filter(e=>e.hp>0).map(e=>key(e.x,e.y))]);
    if(game.chest)occupied.add(key(game.chest.x,game.chest.y));
    const spots=[];for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)if(game.grid[y][x]&&!occupied.has(key(x,y)))spots.push({x,y});
    if(spots.length){const p=spots[rnd(spots.length)];game.items.push({name:'矢',type:'arrow',icon:'➶',value:3+rnd(4),x:p.x,y:p.y})}
  };

  document.addEventListener('click',e=>{const d=e.target.closest('[data-dir]');if(d){const [dx,dy]=d.dataset.dir.split(',').map(Number);if(dx||dy)facing=[dx,dy]}});
  document.addEventListener('keydown',e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(m[e.key])facing=m[e.key]});
  document.addEventListener('DOMContentLoaded',()=>{button()?.addEventListener('click',shoot);sync();new MutationObserver(sync).observe(document.getElementById('board')||document.body,{childList:true,subtree:true})});
})();
