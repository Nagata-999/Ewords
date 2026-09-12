'use strict';
(function(){
  const RANGE=7;
  const DIR_FROM_CLASS={
    'facing-n':[0,-1],'facing-ne':[1,-1],'facing-e':[1,0],'facing-se':[1,1],
    'facing-s':[0,1],'facing-sw':[-1,1],'facing-w':[-1,0],'facing-nw':[-1,-1]
  };
  let arrows=0;
  let facing=[0,1];
  let flying=false;

  function button(){return document.getElementById('arrowBtn')}
  function sync(){
    if(game&&Number.isFinite(game.arrows))arrows=game.arrows;
    const b=button();if(!b)return;
    b.disabled=!game||game.dead||arrows<=0||flying;
    b.innerHTML=`<span>➶</span><b>矢 ${arrows}</b>`;
  }
  function setCount(n){arrows=Math.max(0,n|0);if(game)game.arrows=arrows;sync()}
  function learnFacing(){
    const p=document.querySelector('#board .entity.player');if(!p)return;
    for(const [c,d] of Object.entries(DIR_FROM_CLASS))if(p.classList.contains(c)){facing=d;break}
  }
  function enemyAt(x,y){return game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y)}
  function visibleCell(x,y){return document.querySelector(`#board .cell[data-x="${x}"][data-y="${y}"]`)}
  function pointFor(x,y){
    const wrap=document.getElementById('boardWrap'),cell=visibleCell(x,y);
    if(!wrap||!cell)return null;
    const wr=wrap.getBoundingClientRect(),cr=cell.getBoundingClientRect();
    return {x:cr.left-wr.left+cr.width/2,y:cr.top-wr.top+cr.height/2,size:Math.min(cr.width,cr.height)};
  }
  function angle(dx,dy){return Math.atan2(dy,dx)*180/Math.PI}
  function animateArrow(path,dx,dy,hit){
    const wrap=document.getElementById('boardWrap');if(!wrap)return Promise.resolve();
    const pts=path.map(p=>pointFor(p.x,p.y)).filter(Boolean);
    const start=pointFor(game.player.x,game.player.y);
    if(!start||!pts.length)return Promise.resolve();
    const el=document.createElement('span');el.className='flyingArrow';el.textContent='➶';
    el.style.left=`${start.x}px`;el.style.top=`${start.y}px`;el.style.fontSize=`${Math.max(20,start.size*.72)}px`;el.style.transform=`translate(-50%,-50%) rotate(${angle(dx,dy)}deg)`;
    wrap.append(el);
    return new Promise(resolve=>{
      let i=0;
      function step(){
        if(i>=pts.length){
          if(hit){el.classList.add('arrowImpact');setTimeout(()=>{el.remove();resolve()},105)}
          else {el.classList.add('arrowFade');setTimeout(()=>{el.remove();resolve()},90)}
          return;
        }
        const p=pts[i++];el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;
        setTimeout(step,42);
      }
      requestAnimationFrame(step);
    });
  }
  async function shoot(){
    if(!game||game.dead||arrows<=0||flying)return;
    learnFacing();
    const [dx,dy]=facing;if(!dx&&!dy)return;
    flying=true;setCount(arrows-1);
    let x=game.player.x,y=game.player.y,hit=null;
    const path=[];
    for(let i=0;i<RANGE;i++){
      x+=dx;y+=dy;
      if(x<0||y<0||x>=W||y>=H||!game.grid[y]?.[x])break;
      path.push({x,y});hit=enemyAt(x,y);if(hit)break;
    }
    await animateArrow(path,dx,dy,hit);
    if(hit){
      const dmg=4+Math.floor(game.level*.7)+rnd(3);
      hit.hp-=dmg;
      msg(`➶ ${hit.name}に${dmg}ダメージ。`);
      const cell=visibleCell(hit.x,hit.y);if(cell){cell.classList.remove('arrowHit');void cell.offsetWidth;cell.classList.add('arrowHit');setTimeout(()=>cell.classList.remove('arrowHit'),180)}
      if(hit.hp<=0){
        game.exp+=hit.exp;log(`${hit.name}を矢で倒した。`);
        while(game.exp>=game.nextExp){game.exp-=game.nextExp;game.level++;game.nextExp=Math.floor(game.nextExp*1.45)+3;game.maxHp+=4;game.hp=game.maxHp;msg(`レベル${game.level}！ HP全回復。`);log(`Lv ${game.level}になった。`)}
      }
    }else msg('➶ 矢は暗闇へ飛んでいった。');
    endTurn();flying=false;sync();
  }

  const oldPickup=window.pickup;
  if(typeof oldPickup==='function')window.pickup=function(){
    const i=game?.items?.findIndex(it=>it.x===game.player.x&&it.y===game.player.y&&it.type==='arrow');
    if(i>=0){const it=game.items.splice(i,1)[0];setCount(arrows+(it.value||3));msg(`➶ 矢を${it.value||3}本拾った。`);log(`矢 +${it.value||3}`);return}
    return oldPickup();
  };

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
  window.addEventListener('sushi-facing',e=>{const dx=Number(e.detail?.dx)||0,dy=Number(e.detail?.dy)||0;if(dx||dy)facing=[dx,dy]});
  document.addEventListener('DOMContentLoaded',()=>{button()?.addEventListener('click',shoot);sync();new MutationObserver(sync).observe(document.getElementById('board')||document.body,{childList:true,subtree:true})});
})();
