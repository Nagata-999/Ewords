'use strict';
const BASE_GENERATE=generateFloor,BASE_ATTACK=attack,BASE_ENEMY_TURN=enemyTurn;
const VIEW_W=11,VIEW_H=7,HALF_W=5,HALF_H=3;
let playerMotion='idle',motionSeq=0,playerFacing='s';
let cameraX=null,cameraY=null;
function inside(x,y){return x>=0&&y>=0&&x<W&&y<H}
function walkable(x,y){return inside(x,y)&&!!game.grid[y][x]}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function resetCamera(){if(!game?.player)return;cameraX=clamp(game.player.x,HALF_W,W-1-HALF_W);cameraY=clamp(game.player.y,HALF_H,H-1-HALF_H)}
function followCamera(){
  if(!game?.player)return;
  if(cameraX==null||cameraY==null){resetCamera();return}
  let sx=game.player.x-cameraX+HALF_W,sy=game.player.y-cameraY+HALF_H;
  if(sx<2)cameraX=game.player.x-(2-HALF_W);
  else if(sx>8)cameraX=game.player.x-(8-HALF_W);
  if(sy<2)cameraY=game.player.y-(2-HALF_H);
  else if(sy>4)cameraY=game.player.y-(4-HALF_H);
  cameraX=clamp(cameraX,HALF_W,W-1-HALF_W);
  cameraY=clamp(cameraY,HALF_H,H-1-HALF_H);
}
function facingFrom(dx,dy,current='s'){if(Math.abs(dx)>Math.abs(dy))return dx>0?'e':'w';if(dy!==0)return dy>0?'s':'n';return current}
function cornerCombatClear(ax,ay,bx,by){const dx=bx-ax,dy=by-ay;if(Math.abs(dx)!==1||Math.abs(dy)!==1)return true;return walkable(ax+dx,ay)&&walkable(ax,ay+dy)}
function rememberSeen(){if(!game)return;if(!(game.seen instanceof Set))game.seen=new Set(Array.isArray(game.seen)?game.seen:[]);for(let y=game.player.y-4;y<=game.player.y+4;y++)for(let x=game.player.x-6;x<=game.player.x+6;x++)if(inside(x,y))game.seen.add(key(x,y))}
function visibleNow(x,y){return Math.abs(x-game.player.x)<=5&&Math.abs(y-game.player.y)<=3}
function wallTouchesFloor(x,y){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if((xx||yy)&&walkable(x+xx,y+yy))return true;return false}
function cardinalMask(x,y){let m=0;if(walkable(x,y-1))m|=1;if(walkable(x+1,y))m|=2;if(walkable(x,y+1))m|=4;if(walkable(x-1,y))m|=8;return m}
function diagonalMask(x,y){let m=0;if(walkable(x+1,y-1))m|=1;if(walkable(x+1,y+1))m|=2;if(walkable(x-1,y+1))m|=4;if(walkable(x-1,y-1))m|=8;return m}
function wallAutoClass(x,y){const m=cardinalMask(x,y),d=diagonalMask(x,y),names={0:'pillar',1:'south-face',2:'west-face',3:'corner-sw',4:'north-face',5:'vertical-gap',6:'corner-nw',7:'cap-west',8:'east-face',9:'corner-se',10:'horizontal-gap',11:'cap-south',12:'corner-ne',13:'cap-east',14:'cap-north',15:'island'};let cls=`wall-auto wall-${names[m]} wall-mask-${m} diag-${d}`;if(m===0){if(d===1)cls+=' outer-corner-sw';else if(d===2)cls+=' outer-corner-nw';else if(d===4)cls+=' outer-corner-ne';else if(d===8)cls+=' outer-corner-se'}return cls}
function floorAutoClass(x,y){const n=walkable(x,y-1),e=walkable(x+1,y),s=walkable(x,y+1),w=walkable(x-1,y),p=['floor-auto'];if(!n)p.push('edge-n');if(!e)p.push('edge-e');if(!s)p.push('edge-s');if(!w)p.push('edge-w');if(!n&&!w)p.push('floor-corner-nw');if(!n&&!e)p.push('floor-corner-ne');if(!s&&!w)p.push('floor-corner-sw');if(!s&&!e)p.push('floor-corner-se');return p.join(' ')}
function tileVariant(x,y,count){return Math.abs((x*17+y*31+game.floor*13)%count)}
function flashMotion(target,state,duration=250){const seq=++motionSeq;if(target==='player')playerMotion=state;else if(target)target.motion=state;render();setTimeout(()=>{if(target==='player')playerMotion='idle';else if(target&&target.hp>0)target.motion='idle';if(seq<=motionSeq+20&&game&&!game.dead)render()},duration)}
generateFloor=function(){BASE_GENERATE();game.seen=new Set();game.enemies.forEach(e=>{e.motion='idle';e.facing='s'});playerMotion='idle';playerFacing='s';rememberSeen();resetCamera()};
const BASE_MOVE=move;
move=function(dx,dy){
  playerFacing=facingFrom(dx,dy,playerFacing);
  if(game&&dx&&dy){const tx=game.player.x+dx,ty=game.player.y+dy,e=game.enemies.find(e=>e.hp>0&&e.x===tx&&e.y===ty);if(e&&!cornerCombatClear(game.player.x,game.player.y,tx,ty)){msg('壁越しには攻撃できない。');render();return}}
  const before=game&&game.player?{x:game.player.x,y:game.player.y}:null;
  BASE_MOVE(dx,dy);
  if(before&&game&&!game.dead){const moved=before.x!==game.player.x||before.y!==game.player.y;if(moved){followCamera();game.enemies.forEach(e=>{const px=game.player.x-e.x,py=game.player.y-e.y;if(Math.abs(px)+Math.abs(py)<8)e.facing=facingFrom(px,py,e.facing||'s')})}}
  render()
};
attack=function(e){if(!cornerCombatClear(game.player.x,game.player.y,e.x,e.y)){msg('壁越しには攻撃できない。');return false}playerFacing=facingFrom(e.x-game.player.x,e.y-game.player.y,playerFacing);e.facing=facingFrom(game.player.x-e.x,game.player.y-e.y,e.facing||'s');flashMotion('player','attack',220);flashMotion(e,'hit',280);BASE_ATTACK(e);return true};
enemyTurn=function(){const blocked=[];if(game&&!game.dead){game.enemies.forEach(e=>{if(e.hp>0)e.facing=facingFrom(game.player.x-e.x,game.player.y-e.y,e.facing||'s')});for(const e of game.enemies){if(e.hp<=0||e.asleep)continue;const dx=game.player.x-e.x,dy=game.player.y-e.y;if(Math.abs(dx)===1&&Math.abs(dy)===1&&!cornerCombatClear(e.x,e.y,game.player.x,game.player.y)){blocked.push({e,asleep:e.asleep});e.asleep=true}}const attackers=game.enemies.filter(e=>e.hp>0&&!e.asleep&&Math.max(Math.abs(e.x-game.player.x),Math.abs(e.y-game.player.y))<=1&&cornerCombatClear(e.x,e.y,game.player.x,game.player.y));if(attackers.length){attackers.forEach(e=>flashMotion(e,'attack',230));flashMotion('player','hit',280)}}BASE_ENEMY_TURN();for(const b of blocked)if(b.e.hp>0)b.e.asleep=b.asleep};
function doAttack(){if(!game||game.dead)return;const map={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]},[dx,dy]=map[playerFacing]||[0,1],e=game.enemies.find(e=>e.hp>0&&e.x===game.player.x+dx&&e.y===game.player.y+dy);if(e)attack(e);else{flashMotion('player','attack',220);msg('空振り。')}endTurn()}
function entitySpan(cls,html,title=''){const s=document.createElement('span');s.className=`entity ${cls}`;if(title)s.title=title;s.innerHTML=html;return s}
function render(){
  if(!game)return;
  if(cameraX==null||cameraY==null)resetCamera();
  rememberSeen();
  $('floorLabel').textContent=game.floor+'F';$('levelLabel').textContent='Lv '+game.level;$('hpLabel').textContent=`HP ${Math.max(0,game.hp)}/${game.maxHp}`;$('hungerLabel').textContent=`🍣 ${game.hunger}/${game.maxHunger}`;$('hpBar').style.width=Math.max(0,game.hp/game.maxHp*100)+'%';$('hungerBar').style.width=game.hunger/game.maxHunger*100+'%';$('weaponLabel').textContent='⚔ '+(game.weapon?game.weapon.name+(game.weapon.plus?' +'+game.weapon.plus:''):'素手');$('shieldLabel').textContent='🛡 '+(game.shield?game.shield.name+(game.shield.plus?' +'+game.shield.plus:''):'なし');$('accLabel').textContent='✨ '+(game.accessory?.name||'なし');$('invCount').textContent=game.inventory.length;
  const board=$('board');board.style.gridTemplateColumns=`repeat(${VIEW_W},1fr)`;board.style.gridTemplateRows=`repeat(${VIEW_H},1fr)`;board.replaceChildren();const avatar=readAvatar();
  for(let vy=0;vy<VIEW_H;vy++)for(let vx=0;vx<VIEW_W;vx++){
    const x=cameraX+(vx-HALF_W),y=cameraY+(vy-HALF_H),c=document.createElement('div');
    if(!inside(x,y)){c.className='cell void';board.append(c);continue}
    const now=visibleNow(x,y),seen=game.seen.has(key(x,y));
    if(!seen){c.className='cell void';board.append(c);continue}
    if(walkable(x,y))c.className=`cell floor floor-${tileVariant(x,y,3)} ${floorAutoClass(x,y)}`+(now?'':' memory');
    else if(wallTouchesFloor(x,y))c.className=`cell wall wall-${tileVariant(x,y,4)} ${wallAutoClass(x,y)}`+(now?'':' memory');
    else{c.className='cell void';board.append(c);continue}
    if(now&&walkable(x,y)&&x===game.exit.x&&y===game.exit.y)c.classList.add('exit');
    if(now&&walkable(x,y)){
      const item=game.items.find(i=>i.x===x&&i.y===y);if(item)c.append(entitySpan('item',item.icon));
      if(game.chest&&!game.chest.open&&game.chest.x===x&&game.chest.y===y)c.append(entitySpan('treasure','🎁'));
      const e=game.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);if(e)c.append(entitySpan(`enemy facing-${e.facing||'s'} motion-${e.motion||'idle'}`,`<span class="enemyGlyph">${e.icon}</span><i class="enemyHp"><b style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></b></i>`,e.name))
    }
    if(game.player.x===x&&game.player.y===y)c.append(entitySpan(`player facing-${playerFacing} motion-${playerMotion}`,avatarSVG(avatar),'あなた'));
    board.append(c)
  }
  const attackBtn=$('attackBtn');if(attackBtn){const map={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]},d=map[playerFacing]||[0,1],enemy=game.enemies.find(e=>e.hp>0&&e.x===game.player.x+d[0]&&e.y===game.player.y+d[1]);attackBtn.classList.toggle('enemyReady',!!enemy);attackBtn.textContent=enemy?'⚔ 攻撃！':'⚔ 攻撃'}
}
setTimeout(()=>{const b=$('attackBtn');if(b)b.onclick=doAttack},0);
