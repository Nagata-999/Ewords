'use strict';
// Wide player-centered camera + lightweight combat motion layer.
const BASE_RENDER=render;
const BASE_GENERATE=generateFloor;
const BASE_ATTACK=attack;
const BASE_ENEMY_TURN=enemyTurn;

const VIEW_W=11,VIEW_H=7,HALF_W=5,HALF_H=3;
let playerMotion='idle';
let motionSeq=0;

function rememberSeen(){
  if(!game)return;
  if(!(game.seen instanceof Set)) game.seen=new Set(Array.isArray(game.seen)?game.seen:[]);
  for(let y=game.player.y-HALF_H;y<=game.player.y+HALF_H;y++){
    for(let x=game.player.x-HALF_W;x<=game.player.x+HALF_W;x++){
      if(y<0||x<0||y>=H||x>=W)continue;
      const dx=Math.abs(x-game.player.x),dy=Math.abs(y-game.player.y);
      if(dx<=5&&dy<=3) game.seen.add(key(x,y));
    }
  }
}

generateFloor=function(){
  BASE_GENERATE();
  game.seen=new Set();
  game.enemies.forEach(e=>e.motion='idle');
  playerMotion='idle';
  rememberSeen();
};

function visibleNow(x,y){
  const dx=Math.abs(x-game.player.x),dy=Math.abs(y-game.player.y);
  return dx<=5&&dy<=3;
}

function flashMotion(target,state,duration=250){
  const seq=++motionSeq;
  if(target==='player') playerMotion=state;
  else if(target) target.motion=state;
  setTimeout(()=>{
    if(target==='player') playerMotion='idle';
    else if(target&&target.hp>0) target.motion='idle';
    if(seq<=motionSeq+20&&game&&!game.dead) render();
  },duration);
}

attack=function(e){
  flashMotion('player','attack',220);
  flashMotion(e,'hit',280);
  BASE_ATTACK(e);
};

enemyTurn=function(){
  if(game&&!game.dead){
    const attackers=game.enemies.filter(e=>e.hp>0&&!e.asleep&&Math.max(Math.abs(e.x-game.player.x),Math.abs(e.y-game.player.y))<=1);
    if(attackers.length){
      attackers.forEach(e=>flashMotion(e,'attack',230));
      flashMotion('player','hit',280);
    }
  }
  BASE_ENEMY_TURN();
};

function entitySpan(cls,html,title=''){
  const s=document.createElement('span');
  s.className=`entity ${cls}`;
  if(title)s.title=title;
  s.innerHTML=html;
  return s;
}

function tileVariant(x,y,count){
  return Math.abs((x*17+y*31+game.floor*13)%count);
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
  board.style.gridTemplateColumns=`repeat(${VIEW_W},1fr)`;
  board.style.gridTemplateRows=`repeat(${VIEW_H},1fr)`;
  board.replaceChildren();
  const avatar=readAvatar();

  for(let vy=0;vy<VIEW_H;vy++){
    for(let vx=0;vx<VIEW_W;vx++){
      const x=game.player.x+(vx-HALF_W),y=game.player.y+(vy-HALF_H);
      const c=document.createElement('div');
      if(x<0||y<0||x>=W||y>=H){c.className='cell void';board.append(c);continue;}
      const now=visibleNow(x,y),seen=game.seen.has(key(x,y));
      if(!seen){c.className='cell void';board.append(c);continue;}
      if(game.grid[y][x]) c.className=`cell floor floor-${tileVariant(x,y,3)}`+(now?'':' memory');
      else c.className=`cell wall wall-${tileVariant(x,y,4)}`+(now?'':' memory');
      if(now&&game.grid[y][x]&&x===game.exit.x&&y===game.exit.y)c.classList.add('exit');

      if(now){
        const item=game.items.find(i=>i.x===x&&i.y===y);
        if(item)c.append(entitySpan('item',item.icon));
        if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.append(entitySpan('treasure','🎁'));
        const e=game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
        if(e){
          const enemy=entitySpan(`enemy motion-${e.motion||'idle'}`,`<span class="enemyGlyph">${e.icon}</span><i class="enemyHp"><b style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></b></i>`,e.name);
          c.append(enemy);
        }
      }

      if(game.player.x===x&&game.player.y===y){
        const p=entitySpan(`player motion-${playerMotion}`,avatarSVG(avatar),'あなた');
        c.append(p);
      }
      board.append(c);
    }
  }
};
