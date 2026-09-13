'use strict';
(function(){
  const ZONE_ENEMIES=[
    {name:'火の粉スライム',icon:'🔥',hp:24,atk:10,exp:11,min:21,max:24},
    {name:'マグマコウモリ',icon:'🦇',hp:22,atk:11,exp:11,min:21,max:26},
    {name:'火トカゲ',icon:'🦎',hp:29,atk:12,exp:14,min:22,max:28},
    {name:'溶岩ゴブリン',icon:'👺',hp:33,atk:13,exp:16,min:24,max:30},
    {name:'黒鉄の騎士',icon:'🛡️',hp:42,atk:15,exp:20,min:26,max:30}
  ];
  function poolForFloor(floor){return floor>=21&&floor<=30?ZONE_ENEMIES.filter(e=>floor>=e.min&&floor<=e.max):null}
  function buildEnemy(base,pos,floor){const depth=floor-21,hp=base.hp+Math.floor(depth/2);return {...base,x:pos.x,y:pos.y,hp,maxHp:hp,atk:base.atk+Math.floor(depth/4),asleep:false,motion:'idle',facing:'s'}}
  const baseGenerate=generateFloor;
  generateFloor=function(){const r=baseGenerate.apply(this,arguments);if(!game||game.floor<21||game.floor>30)return r;const pool=poolForFloor(game.floor);if(!pool?.length)return r;const positions=(game.enemies||[]).filter(e=>!e.isBoss).map(e=>({x:e.x,y:e.y}));game.enemies=positions.map(p=>buildEnemy(pool[rnd(pool.length)],p,game.floor));if(game.floor===21)log('灼熱の溶岩洞窟に入った。空気が焼けるように熱い。');return r};
  const prevPool=window.sushiEnemyPoolForFloor;
  window.sushiEnemyPoolForFloor=function(floor){const z=poolForFloor(floor);if(z)return z;return typeof prevPool==='function'?prevPool(floor):[]};
  window.sushiZone2130Enemies=ZONE_ENEMIES;
})();