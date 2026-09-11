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
  function attackPlayer(e,mult=1,extra=0,label=''){
    const def=(game.shield?.power||0)+(game.shield?.plus||0)+(game.accessory?.effect==='defense'?2:0);
    const base=e.atk+Math.floor(game.floor/4)-Math.floor(def*.55)+rnd(3)-1;
    const dmg=Math.max(1,Math.floor(base*mult)+extra);
    game.hp-=dmg;
    if(typeof flashMotion==='function'){flashMotion(e,'attack',230);flashMotion('player','hit',280)}
    msg(`${e.name}${label?'の'+label:'の攻撃'}！ ${dmg}ダメージ。`);
    if(game.hp<=0){die(e.name);return true}
    return false;
  }
  function chase(e,style='normal'){
    const dx=game.player.x-e.x,dy=game.player.y-e.y,sx=Math.sign(dx),sy=Math.sign(dy);
    let tries;
    if(style==='cardinal')tries=Math.abs(dx)>=Math.abs(dy)?[[sx,0],[0,sy],[sx,sy]]:[[0,sy],[sx,0],[sx,sy]];
    else if(style==='flutter')tries=[[sx,sy],[0,Math.random()<.5?1:-1],[Math.random()<.5?1:-1,0],[sx,0],[0,sy]];
    else tries=[[sx,sy],[sx,0],[0,sy]];
    for(const [mx,my] of tries)if(step(e,mx,my))return true;
    return false;
  }
  function wander(e){
    const dirs=[...DIRS].sort(()=>Math.random()-.5);
    for(const [mx,my] of dirs)if(step(e,mx,my))return true;
    return false;
  }
  enemyTurn=function(){
    for(const e of game.enemies){
      if(e.hp<=0)continue;
      if(e.asleep){if(Math.random()<.18)e.asleep=false;continue}
      e.aiTick=(e.aiTick||0)+1;
      const dx=game.player.x-e.x,dy=game.player.y-e.y,dist=Math.abs(dx)+Math.abs(dy);
      if(adjacent(e)){
        let dead=false;
        if(e.name==='毒蜘蛛'&&Math.random()<.28){dead=attackPlayer(e,1,2,'毒牙');game.hunger=Math.max(0,game.hunger-3);if(!dead)msg('毒で満腹度も3減った。')}
        else if(e.name==='オーク兵'&&Math.random()<.25)dead=attackPlayer(e,1.45,0,'強打');
        else if(e.name==='洞窟トロル'&&Math.random()<.35)dead=attackPlayer(e,1.6,0,'豪腕');
        else dead=attackPlayer(e);
        if(dead)return;
        continue;
      }
      const aware=dist<8;
      if(!aware){if(Math.random()<.35)wander(e);continue}
      if(e.name==='石像兵'&&e.aiTick%2===1)continue;
      if(e.name==='洞窟トロル'&&Math.random()<.42)continue;
      if(e.name==='洞窟コウモリ'){chase(e,'flutter');continue}
      if(e.name==='骸骨兵'){chase(e,'cardinal');continue}
      if(e.name==='緑小鬼'){
        const straight=(dx===0||dy===0),two=Math.max(Math.abs(dx),Math.abs(dy))===2;
        if(straight&&two&&Math.random()<.55){const sx=Math.sign(dx),sy=Math.sign(dy),mx=e.x+sx,my=e.y+sy,tx=e.x+sx*2,ty=e.y+sy*2;if(free(mx,my,e)&&open(tx,ty)){e.x=mx;e.y=my;if(adjacent(e)&&Math.random()<.65){if(attackPlayer(e,1.15,0,'突進'))return}continue}}
        chase(e);continue;
      }
      if(e.name==='洞窟ネズミ'){
        chase(e);
        if(!adjacent(e)&&Math.random()<.28)chase(e);
        continue;
      }
      chase(e);
    }
  };
})();