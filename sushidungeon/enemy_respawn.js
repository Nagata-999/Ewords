'use strict';
(function(){
  const RESPAWN_LIMIT=5;
  const CHECK_EVERY=18;
  const RESPAWN_CHANCE=.42;
  const MAX_LIVING=8;

  function floorPool(){
    if(!game)return [];
    if(typeof window.sushiEnemyPoolForFloor==='function'){
      const custom=window.sushiEnemyPoolForFloor(game.floor);
      if(Array.isArray(custom)&&custom.length)return custom;
    }
    const tierFloor=((game.floor-1)%10)+1;
    return ENEMIES.filter(e=>tierFloor>=e.min&&tierFloor<=e.max);
  }

  function scaleEnemy(base){
    const realFloor=game.floor;
    if(realFloor>=11&&realFloor<=20&&Array.isArray(window.sushiZone1120Enemies)&&window.sushiZone1120Enemies.includes(base)){
      const depth=realFloor-11,hp=base.hp+Math.floor(depth/2);
      return {...base,hp,maxHp:hp,atk:base.atk+Math.floor(depth/4),asleep:false,motion:'idle',facing:'s',respawned:true};
    }
    if(realFloor>=21&&realFloor<=30&&Array.isArray(window.sushiZone2130Enemies)&&window.sushiZone2130Enemies.includes(base)){
      const depth=realFloor-21,hp=base.hp+Math.floor(depth/2);
      return {...base,hp,maxHp:hp,atk:base.atk+Math.floor(depth/4),asleep:false,motion:'idle',facing:'s',respawned:true};
    }
    const zone=Math.floor((realFloor-1)/10);
    const hpBase=base.hp+Math.floor((((realFloor-1)%10)+1)/3);
    const hpBonus=zone>0?zone*5+Math.floor(realFloor/10):0;
    return {...base,hp:hpBase+hpBonus,maxHp:hpBase+hpBonus,atk:base.atk+(zone>0?Math.floor(zone*1.2):0),exp:zone>0?Math.max(1,Math.round(base.exp*(1+zone*.35))):base.exp,asleep:false,motion:'idle',facing:'s',respawned:true};
  }

  function spawnSpot(){
    const occupiedKeys=new Set(game.enemies.filter(e=>e.hp>0).map(e=>`${e.x},${e.y}`));
    const spots=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      if(!game.grid[y][x])continue;if(x===game.player.x&&y===game.player.y)continue;if(x===game.exit.x&&y===game.exit.y)continue;if(game.chest&&!game.chest.open&&x===game.chest.x&&y===game.chest.y)continue;if(occupiedKeys.has(`${x},${y}`))continue;
      const d=Math.max(Math.abs(x-game.player.x),Math.abs(y-game.player.y));if(d>=5)spots.push({x,y});
    }
    return spots.length?spots[rnd(spots.length)]:null;
  }

  function tryRespawn(){
    if(!game||game.dead)return;if(game.floor===window.SUSHI_FINAL_FLOOR)return;if((game.respawnCount||0)>=RESPAWN_LIMIT)return;if(game.turn-(game.lastRespawnCheck||0)<CHECK_EVERY)return;
    game.lastRespawnCheck=game.turn;const living=game.enemies.filter(e=>e.hp>0&&!e.isBoss).length;if(living>=MAX_LIVING||Math.random()>RESPAWN_CHANCE)return;
    const pool=floorPool(),p=spawnSpot();if(!pool.length||!p)return;const base=pool[rnd(pool.length)],e=scaleEnemy(base);e.x=p.x;e.y=p.y;game.enemies.push(e);game.respawnCount=(game.respawnCount||0)+1;
    msg(`気配がする…… ${e.name}が現れた。`);log(`敵が再出現した：${e.name}（${game.respawnCount}/${RESPAWN_LIMIT}）`);
  }

  const baseGenerate=generateFloor;
  generateFloor=function(){const r=baseGenerate.apply(this,arguments);game.respawnCount=0;game.lastRespawnCheck=game.turn||0;return r};
  const baseEndTurn=endTurn;
  endTurn=function(){const r=baseEndTurn.apply(this,arguments);if(game&&!game.dead){tryRespawn();render()}return r};
  window.sushiEnemyRespawn={limit:RESPAWN_LIMIT,tryRespawn};
})();