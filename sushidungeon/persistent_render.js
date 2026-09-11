'use strict';
(function(){
  const cells=[];
  let playerEl=null;
  const enemyEls=new Map();
  let nextEnemyId=1;

  function ensureBoard(){
    const board=$('board');
    if(!board)return null;
    board.style.gridTemplateColumns=`repeat(${VIEW_W},1fr)`;
    board.style.gridTemplateRows=`repeat(${VIEW_H},1fr)`;
    if(cells.length!==VIEW_W*VIEW_H||board.children.length!==VIEW_W*VIEW_H){
      cells.length=0;board.replaceChildren();
      for(let i=0;i<VIEW_W*VIEW_H;i++){const c=document.createElement('div');c.className='cell void';board.append(c);cells.push(c)}
    }
    return board;
  }
  function hud(){
    $('floorLabel').textContent=game.floor+'F';$('levelLabel').textContent='Lv '+game.level;
    $('hpLabel').textContent=`HP ${Math.max(0,game.hp)}/${game.maxHp}`;$('hungerLabel').textContent=`🍣 ${game.hunger}/${game.maxHunger}`;
    $('hpBar').style.width=Math.max(0,game.hp/game.maxHp*100)+'%';$('hungerBar').style.width=game.hunger/game.maxHunger*100+'%';
    $('weaponLabel').textContent='⚔ '+(game.weapon?game.weapon.name+(game.weapon.plus?' +'+game.weapon.plus:''):'素手');
    $('shieldLabel').textContent='🛡 '+(game.shield?game.shield.name+(game.shield.plus?' +'+game.shield.plus:''):'なし');
    $('accLabel').textContent='✨ '+(game.accessory?.name||'なし');$('invCount').textContent=game.inventory.length;
  }
  function screenCell(x,y){const vx=x-cameraX+HALF_W,vy=y-cameraY+HALF_H;if(vx<0||vy<0||vx>=VIEW_W||vy>=VIEW_H)return null;return cells[vy*VIEW_W+vx]}
  function cleanTransient(c){c.querySelectorAll('.item,.treasure').forEach(n=>n.remove())}
  function paintTiles(){
    let i=0;
    for(let vy=0;vy<VIEW_H;vy++)for(let vx=0;vx<VIEW_W;vx++,i++){
      const x=cameraX+(vx-HALF_W),y=cameraY+(vy-HALF_H),c=cells[i];cleanTransient(c);
      if(!inside(x,y)){c.className='cell void';continue}
      const now=visibleNow(x,y),seen=game.seen.has(key(x,y));if(!seen){c.className='cell void';continue}
      if(walkable(x,y))c.className=`cell floor floor-${tileVariant(x,y,3)} ${floorAutoClass(x,y)}`+(now?'':' memory');
      else if(wallTouchesFloor(x,y))c.className=`cell wall wall-${tileVariant(x,y,4)} ${wallAutoClass(x,y)}`+(now?'':' memory');
      else{c.className='cell void';continue}
      if(now&&walkable(x,y)&&x===game.exit.x&&y===game.exit.y)c.classList.add('exit');
      if(now&&walkable(x,y)){
        const item=game.items.find(it=>it.x===x&&it.y===y);if(item)c.append(entitySpan('item',item.icon));
        if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.append(entitySpan('treasure','🎁'));
      }
    }
  }
  function ensurePlayer(){if(!playerEl){playerEl=entitySpan('player','', 'あなた');playerEl.dataset.persistent='1'}return playerEl}
  function enemyNode(e){
    if(!e._renderId)e._renderId=nextEnemyId++;
    let el=enemyEls.get(e._renderId);
    if(!el){el=entitySpan('enemy','',e.name);el.dataset.persistent='1';enemyEls.set(e._renderId,el)}
    return el;
  }
  function placeEntities(){
    const avatar=readAvatar(),p=ensurePlayer(),pc=screenCell(game.player.x,game.player.y);
    if(pc){const cls=`entity player facing-${playerFacing} motion-${playerMotion}`;if(p.className!==cls)p.className=cls;const sig=playerFacing+'|'+JSON.stringify(avatar);if(p.dataset.baseSig!==sig){p.dataset.baseSig=sig;p.dataset.dirSig='';p.innerHTML=avatarSVG(avatar)};pc.append(p)}else p.remove();
    const alive=new Set();
    for(const e of game.enemies){if(e.hp<=0)continue;const c=screenCell(e.x,e.y);if(!c)continue;const now=visibleNow(e.x,e.y);if(!now)continue;const el=enemyNode(e);alive.add(e._renderId);const dir=e.facing||'s',motion=e.motion||'idle';el.className=`entity enemy facing-${dir} motion-${motion}`;el.title=e.name;const hp=Math.max(0,e.hp/e.maxHp*100);const sig=`${e.name}|${dir}|${Math.round(hp)}`;if(el.dataset.baseSig!==sig){el.dataset.baseSig=sig;el.dataset.fullSprite='';el.dataset.dirSig='';el.innerHTML=`<span class="enemyGlyph">${e.icon}</span><i class="enemyHp"><b style="width:${hp}%"></b></i>`}c.append(el)}
    for(const [id,el] of enemyEls)if(!alive.has(id)){el.remove();enemyEls.delete(id)}
  }
  function buttons(){const attackBtn=$('attackBtn');if(!attackBtn)return;const map={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]},d=map[playerFacing]||[0,1],enemy=game.enemies.find(e=>e.hp>0&&e.x===game.player.x+d[0]&&e.y===game.player.y+d[1]);attackBtn.classList.toggle('enemyReady',!!enemy);attackBtn.textContent=enemy?'⚔ 攻撃！':'⚔ 攻撃'}

  window.render=function(){if(!game)return;if(cameraX==null||cameraY==null)resetCamera();rememberSeen();ensureBoard();hud();paintTiles();placeEntities();buttons()};
})();
