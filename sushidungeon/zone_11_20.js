'use strict';
(function(){
  const ZONE_ENEMIES=[
    {name:'水スライム',icon:'💧',hp:15,atk:6,exp:6,min:11,max:15},
    {name:'水路コウモリ',icon:'🦇',hp:13,atk:7,exp:6,min:11,max:17},
    {name:'毒ヒル',icon:'🪱',hp:18,atk:8,exp:8,min:12,max:18},
    {name:'沼ゴブリン',icon:'👺',hp:22,atk:9,exp:10,min:14,max:20,spriteBase:'緑小鬼'},
    {name:'錆びた鎧兵',icon:'🛡️',hp:29,atk:11,exp:13,min:16,max:20}
  ];

  function poolForFloor(floor){
    if(floor>=11&&floor<=20)return ZONE_ENEMIES.filter(e=>floor>=e.min&&floor<=e.max);
    return null;
  }

  function buildEnemy(base,pos,floor){
    const depth=floor-11;
    const hpBonus=Math.floor(depth/2);
    const atkBonus=Math.floor(depth/4);
    return {...base,x:pos.x,y:pos.y,hp:base.hp+hpBonus,maxHp:base.hp+hpBonus,atk:base.atk+atkBonus,asleep:false,motion:'idle',facing:'s'};
  }

  const baseGenerate=generateFloor;
  generateFloor=function(){
    const r=baseGenerate.apply(this,arguments);
    if(!game||game.floor<11||game.floor>20)return r;
    const pool=poolForFloor(game.floor);
    if(!pool?.length)return r;
    const positions=(game.enemies||[]).map(e=>({x:e.x,y:e.y}));
    game.enemies=positions.map(p=>buildEnemy(pool[rnd(pool.length)],p,game.floor));
    if(game.floor===11)log('地下水路に入った。湿った空気の中、新しい魔物の気配がする。');
    return r;
  };

  window.sushiEnemyPoolForFloor=function(floor){
    const z=poolForFloor(floor);
    if(z)return z;
    const tier=((floor-1)%10)+1;
    return ENEMIES.filter(e=>tier>=e.min&&tier<=e.max);
  };
  window.sushiZone1120Enemies=ZONE_ENEMIES;
})();