'use strict';
// Player-centered camera view. Keeps unexplored areas off-screen and makes the avatar readable.
const BASE_RENDER=render;
const BASE_GENERATE=generateFloor;

function rememberSeen(){
  if(!game)return;
  if(!(game.seen instanceof Set)) game.seen=new Set(Array.isArray(game.seen)?game.seen:[]);
  const r=3;
  for(let y=game.player.y-r;y<=game.player.y+r;y++){
    for(let x=game.player.x-r;x<=game.player.x+r;x++){
      if(y<0||x<0||y>=H||x>=W)continue;
      const dx=x-game.player.x,dy=y-game.player.y;
      if(Math.max(Math.abs(dx),Math.abs(dy))<=r) game.seen.add(key(x,y));
    }
  }
}

generateFloor=function(){
  BASE_GENERATE();
  game.seen=new Set();
  rememberSeen();
};

function visibleNow(x,y){
  const dx=x-game.player.x,dy=y-game.player.y;
  return Math.max(Math.abs(dx),Math.abs(dy))<=3;
}

render=function(){
  if(!game)return;
  rememberSeen();
  $('floorLabel').textContent=game.floor+'F';
  $('levelLabel').textContent='Lv '+game.level;
  $('hpLabel').textContent=`HP ${Math.max(0,game.hp)}/${game.maxHp}`;
  $('hungerLabel').textContent=`🍣 ${game.hunger}/${game.maxHunger}`;
  $('hpBar').style.width=Math.max(0,game.hp/game.maxHp*100)+'%';
  $('hungerBar').style.width=game.hunger/game.maxHunger*100+'%';
  $('weaponLabel').textContent='⚔ '+(game.weapon?game.weapon.name+(game.weapon.plus?' +'+game.weapon.plus:''):'素手');
  $('shieldLabel').textContent='🛡 '+(game.shield?game.shield.name+(game.shield.plus?' +'+game.shield.plus:''):'なし');
  $('accLabel').textContent='✨ '+(game.accessory?.name||'なし');
  $('invCount').textContent=game.inventory.length;

  const board=$('board');
  const VIEW=7,HALF=3;
  board.style.gridTemplateColumns=`repeat(${VIEW},1fr)`;
  board.style.gridTemplateRows=`repeat(${VIEW},1fr)`;
  board.replaceChildren();
  const avatar=readAvatar();

  for(let vy=0;vy<VIEW;vy++){
    for(let vx=0;vx<VIEW;vx++){
      const x=game.player.x+(vx-HALF),y=game.player.y+(vy-HALF);
      const c=document.createElement('div');
      if(x<0||y<0||x>=W||y>=H){c.className='cell void';board.append(c);continue;}
      const now=visibleNow(x,y),seen=game.seen.has(key(x,y));
      if(!seen){c.className='cell void';board.append(c);continue;}
      c.className='cell '+(game.grid[y][x]?'floor':'wall')+(now?'':' memory');
      if(now&&game.grid[y][x]&&x===game.exit.x&&y===game.exit.y)c.classList.add('exit');
      if(now){
        const item=game.items.find(i=>i.x===x&&i.y===y);
        if(item)c.insertAdjacentHTML('beforeend',`<span class="entity item">${item.icon}</span>`);
        if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.insertAdjacentHTML('beforeend','<span class="entity treasure">🎁</span>');
        const e=game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
        if(e)c.insertAdjacentHTML('beforeend',`<span class="entity enemy" title="${e.name}">${e.icon}</span>`);
      }
      if(game.player.x===x&&game.player.y===y){
        const p=document.createElement('span');
        p.className='entity player';
        p.innerHTML=avatarSVG(avatar);
        c.append(p);
      }
      board.append(c);
    }
  }
};
