'use strict';
(function(){
  function open(x,y){return !!game?.grid?.[y]?.[x]}
  function cornerClear(x,y,tx,ty){
    const dx=tx-x,dy=ty-y;
    if(Math.abs(dx)!==1||Math.abs(dy)!==1)return true;
    return open(x+dx,y)&&open(x,y+dy);
  }
  function adjacent(e){
    const dx=game.player.x-e.x,dy=game.player.y-e.y;
    return Math.max(Math.abs(dx),Math.abs(dy))===1&&cornerClear(e.x,e.y,game.player.x,game.player.y);
  }
  function free(nx,ny,e){
    return open(nx,ny)&&!game.enemies.some(o=>o!==e&&o.hp>0&&o.x===nx&&o.y===ny)&&!(game.player.x===nx&&game.player.y===ny);
  }
  function step(e,mx,my){
    if(!mx&&!my)return false;
    const nx=e.x+mx,ny=e.y+my;
    if(Math.abs(mx)===1&&Math.abs(my)===1&&!cornerClear(e.x,e.y,nx,ny))return false;
    if(!free(nx,ny,e))return false;
    e.x=nx;e.y=ny;return true;
  }
  function attackPlayer(e){
    const def=(game.shield?.power||0)+(game.shield?.plus||0)+(game.accessory?.effect==='defense'?2:0);
    const dmg=Math.max(1,e.atk+Math.floor(game.floor/4)-Math.floor(def*.55)+rnd(3)-1);
    game.hp-=dmg;
    if(typeof flashMotion==='function'){flashMotion(e,'attack',230);flashMotion('player','hit',280)}
    msg(`${e.name}の攻撃！ ${dmg}ダメージ。`);
    if(game.hp<=0){die(e.name);return true}
    return false;
  }
  function chase(e){
    const dx=game.player.x-e.x,dy=game.player.y-e.y,sx=Math.sign(dx),sy=Math.sign(dy);
    const tries=[[sx,sy],[sx,0],[0,sy]].sort(()=>Math.random()-.5);
    for(const [mx,my] of tries)if(step(e,mx,my))return true;
    return false;
  }
  function wander(e){
    const dirs=[...DIRS].sort(()=>Math.random()-.5);
    for(const [mx,my] of dirs)if(step(e,mx,my))return true;
    return false;
  }

  // Prototype rule: every enemy gets exactly one action per turn.
  // No charge, double-move, poison bite, heavy attack, or move-then-attack specials for now.
  enemyTurn=function(){
    for(const e of game.enemies){
      if(e.hp<=0)continue;
      if(e.asleep){if(Math.random()<.18)e.asleep=false;continue}
      if(adjacent(e)){
        if(attackPlayer(e))return;
        continue;
      }
      const dist=Math.abs(game.player.x-e.x)+Math.abs(game.player.y-e.y);
      if(dist<8)chase(e);
      else if(Math.random()<.35)wander(e);
    }
  };
})();
