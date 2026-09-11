'use strict';
const BASE_GENERATE=generateFloor;
const BASE_ATTACK=attack;
const BASE_ENEMY_TURN=enemyTurn;
const VIEW_W=11,VIEW_H=7,HALF_W=5,HALF_H=3;
let playerMotion='idle';
let motionSeq=0;

function inside(x,y){return x>=0&&y>=0&&x<W&&y<H}
function walkable(x,y){return inside(x,y)&&!!game.grid[y][x]}
function rememberSeen(){
  if(!game)return;
  if(!(game.seen instanceof Set))game.seen=new Set(Array.isArray(game.seen)?game.seen:[]);
  for(let y=game.player.y-4;y<=game.player.y+4;y++)for(let x=game.player.x-6;x<=game.player.x+6;x++){
    if(!inside(x,y))continue;
    if(Math.abs(x-game.player.x)<=6&&Math.abs(y-game.player.y)<=4)game.seen.add(key(x,y));
  }
}
function visibleNow(x,y){return Math.abs(x-game.player.x)<=5&&Math.abs(y-game.player.y)<=3}
function wallTouchesFloor(x,y){
  for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if((xx||yy)&&walkable(x+xx,y+yy))return true;
  return false;
}
function cardinalMask(x,y){
  let m=0;
  if(walkable(x,y-1))m|=1;
  if(walkable(x+1,y))m|=2;
  if(walkable(x,y+1))m|=4;
  if(walkable(x-1,y))m|=8;
  return m;
}
function diagonalMask(x,y){
  let m=0;
  if(walkable(x+1,y-1))m|=1;
  if(walkable(x+1,y+1))m|=2;
  if(walkable(x-1,y+1))m|=4;
  if(walkable(x-1,y-1))m|=8;
  return m;
}
function wallAutoClass(x,y){
  const m=cardinalMask(x,y),d=diagonalMask(x,y);
  const names={
    0:'pillar',1:'south-face',2:'west-face',3:'corner-sw',4:'north-face',5:'vertical-gap',6:'corner-nw',7:'cap-west',
    8:'east-face',9:'corner-se',10:'horizontal-gap',11:'cap-south',12:'corner-ne',13:'cap-east',14:'cap-north',15:'island'
  };
  let cls=`wall-auto wall-${names[m]} wall-mask-${m} diag-${d}`;
  if(m===0){
    if(d===1)cls+=' outer-corner-sw';
    else if(d===2)cls+=' outer-corner-nw';
    else if(d===4)cls+=' outer-corner-ne';
    else if(d===8)cls+=' outer-corner-se';
  }
  return cls;
}
function floorAutoClass(x,y){
  const n=walkable(x,y-1),e=walkable(x+1,y),s=walkable(x,y+1),w=walkable(x-1,y);
  const parts=['floor-auto'];
  if(!n)parts.push('edge-n'); if(!e)parts.push('edge-e'); if(!s)parts.push('edge-s'); if(!w)parts.push('edge-w');
  if(!n&&!w)parts.push('floor-corner-nw');
  if(!n&&!e)parts.push('floor-corner-ne');
  if(!s&&!w)parts.push('floor-corner-sw');
  if(!s&&!e)parts.push('floor-corner-se');
  return parts.join(' ');
}
function tileVariant(x,y,count){return Math.abs((x*17+y*31+game.floor*13)%count)}
function flashMotion(target,state,duration=250){
  const seq=++motionSeq;
  if(target==='player')playerMotion=state;else if(target)target.motion=state;
  render();
  setTimeout(()=>{
    if(target==='player')playerMotion='idle';else if(target&&target.hp>0)target.motion='idle';
    if(seq<=motionSeq+20&&game&&!game.dead)render();
  },duration);
}
generateFloor=function(){
  BASE_GENERATE();
  game.seen=new Set();
  game.enemies.forEach(e=>e.motion='idle');
  playerMotion='idle';
  rememberSeen();
};
attack=function(e){flashMotion('player','attack',220);flashMotion(e,'hit',280);BASE_ATTACK(e)};
enemyTurn=function(){
  if(game&&!game.dead){
    const attackers=game.enemies.filter(e=>e.hp>0&&!e.asleep&&Math.max(Math.abs(e.x-game.player.x),Math.abs(e.y-game.player.y))<=1);
    if(attackers.length){attackers.forEach(e=>flashMotion(e,'attack',230));flashMotion('player','hit',280)}
  }
  BASE_ENEMY_TURN();
};
function entitySpan(cls,html,title=''){
  const s=document.createElement('span');s.className=`entity ${cls}`;if(title)s.title=title;s.innerHTML=html;return s;
}
function render(){
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

  for(let vy=0;vy<VIEW_H;vy++)for(let vx=0;vx<VIEW_W;vx++){
    const x=game.player.x+(vx-HALF_W),y=game.player.y+(vy-HALF_H);
    const c=document.createElement('div');
    if(!inside(x,y)){c.className='cell void';board.append(c);continue}
    const now=visibleNow(x,y),seen=game.seen.has(key(x,y));
    if(!seen){c.className='cell void';board.append(c);continue}

    if(walkable(x,y)){
      c.className=`cell floor floor-${tileVariant(x,y,3)} ${floorAutoClass(x,y)}`+(now?'':' memory');
    }else if(wallTouchesFloor(x,y)){
      c.className=`cell wall wall-${tileVariant(x,y,4)} ${wallAutoClass(x,y)}`+(now?'':' memory');
    }else{
      c.className='cell void';board.append(c);continue;
    }

    if(now&&walkable(x,y)&&x===game.exit.x&&y===game.exit.y)c.classList.add('exit');
    if(now&&walkable(x,y)){
      const item=game.items.find(i=>i.x===x&&i.y===y);if(item)c.append(entitySpan('item',item.icon));
      if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.append(entitySpan('treasure','🎁'));
      const e=game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
      if(e)c.append(entitySpan(`enemy motion-${e.motion||'idle'}`,`<span class="enemyGlyph">${e.icon}</span><i class="enemyHp"><b style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></b></i>`,e.name));
    }
    if(game.player.x===x&&game.player.y===y)c.append(entitySpan(`player motion-${playerMotion}`,avatarSVG(avatar),'あなた'));
    board.append(c);
  }
}
