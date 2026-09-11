'use strict';
const BASE_GENERATE=generateFloor;
const VIEW_W=11,VIEW_H=7,HALF_W=5,HALF_H=3;
let playerMotion='idle',motionSeq=0,playerFacing='s';
let cameraX=null,cameraY=null;
function inside(x,y){return x>=0&&y>=0&&x<W&&y<H}
function walkable(x,y){return inside(x,y)&&!!game.grid[y][x]}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function resetCamera(){if(!game?.player)return;cameraX=clamp(game.player.x,HALF_W,W-1-HALF_W);cameraY=clamp(game.player.y,HALF_H,H-1-HALF_H)}
function followCamera(){if(!game?.player)return;if(cameraX==null||cameraY==null){resetCamera();return}let sx=game.player.x-cameraX+HALF_W,sy=game.player.y-cameraY+HALF_H;if(sx<2)cameraX=game.player.x-(2-HALF_W);else if(sx>8)cameraX=game.player.x-(8-HALF_W);if(sy<2)cameraY=game.player.y-(2-HALF_H);else if(sy>4)cameraY=game.player.y-(4-HALF_H);cameraX=clamp(cameraX,HALF_W,W-1-HALF_W);cameraY=clamp(cameraY,HALF_H,H-1-HALF_H)}
function facingFrom(dx,dy,current='s'){if(Math.abs(dx)>Math.abs(dy))return dx>0?'e':'w';if(dy!==0)return dy>0?'s':'n';return current}
function rememberSeen(){if(!game?.player)return;if(!(game.seen instanceof Set))game.seen=new Set(Array.isArray(game.seen)?game.seen:[]);for(let y=game.player.y-4;y<=game.player.y+4;y++)for(let x=game.player.x-6;x<=game.player.x+6;x++)if(inside(x,y))game.seen.add(key(x,y))}
function visibleNow(x,y){return !!game?.player&&Math.abs(x-game.player.x)<=5&&Math.abs(y-game.player.y)<=3}
function wallTouchesFloor(x,y){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if((xx||yy)&&walkable(x+xx,y+yy))return true;return false}
function cardinalMask(x,y){let m=0;if(walkable(x,y-1))m|=1;if(walkable(x+1,y))m|=2;if(walkable(x,y+1))m|=4;if(walkable(x-1,y))m|=8;return m}
function diagonalMask(x,y){let m=0;if(walkable(x+1,y-1))m|=1;if(walkable(x+1,y+1))m|=2;if(walkable(x-1,y+1))m|=4;if(walkable(x-1,y-1))m|=8;return m}
function wallAutoClass(x,y){const m=cardinalMask(x,y),d=diagonalMask(x,y),names={0:'pillar',1:'south-face',2:'west-face',3:'corner-sw',4:'north-face',5:'vertical-gap',6:'corner-nw',7:'cap-west',8:'east-face',9:'corner-se',10:'horizontal-gap',11:'cap-south',12:'corner-ne',13:'cap-east',14:'cap-north',15:'island'};let cls=`wall-auto wall-${names[m]} wall-mask-${m} diag-${d}`;if(m===0){if(d===1)cls+=' outer-corner-sw';else if(d===2)cls+=' outer-corner-nw';else if(d===4)cls+=' outer-corner-ne';else if(d===8)cls+=' outer-corner-se'}return cls}
function floorAutoClass(x,y){const n=walkable(x,y-1),e=walkable(x+1,y),s=walkable(x,y+1),w=walkable(x-1,y),p=['floor-auto'];if(!n)p.push('edge-n');if(!e)p.push('edge-e');if(!s)p.push('edge-s');if(!w)p.push('edge-w');if(!n&&!w)p.push('floor-corner-nw');if(!n&&!e)p.push('floor-corner-ne');if(!s&&!w)p.push('floor-corner-sw');if(!s&&!e)p.push('floor-corner-se');return p.join(' ')}
function tileVariant(x,y,count){return Math.abs((x*17+y*31+game.floor*13)%count)}
function entitySpan(cls,html,title=''){const s=document.createElement('span');s.className=`entity ${cls}`;if(title)s.title=title;s.innerHTML=html;return s}
function flashMotion(target,state,duration=250){const seq=++motionSeq;if(target==='player')playerMotion=state;else if(target)target.motion=state;if(typeof render==='function')render();setTimeout(()=>{if(target==='player')playerMotion='idle';else if(target&&target.hp>0)target.motion='idle';if(seq<=motionSeq+20&&game&&!game.dead&&typeof render==='function')render()},duration)}
generateFloor=function(){BASE_GENERATE();game.seen=new Set();game.enemies.forEach(e=>{e.motion='idle';e.facing='s'});playerMotion='idle';playerFacing='s';rememberSeen();resetCamera()};
function doAttack(){if(!game||game.dead)return;const map={n:[0,-1],e:[1,0],s:[0,1],w:[-1,0]},d=map[playerFacing]||[0,1],e=game.enemies.find(e=>e.hp>0&&e.x===game.player.x+d[0]&&e.y===game.player.y+d[1]);playerMotion='attack';if(e)attack(e);else msg('空振り。');endTurn();setTimeout(()=>{if(game&&!game.dead){playerMotion='idle';render()}},180)}
setTimeout(()=>{const b=$('attackBtn');if(b)b.onclick=doAttack},0);
