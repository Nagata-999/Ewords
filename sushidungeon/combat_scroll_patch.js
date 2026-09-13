'use strict';
(function(){
  // Replace the temporary identify scroll with an offensive area scroll.
  const identify=CONSUMABLES.find(it=>it.type==='scroll'&&it.effect==='identify');
  if(identify){
    identify.name='爆発の巻き物';
    identify.effect='explosion';
    identify.desc='周囲約25マスの敵に15ダメージ';
  }

  // Track the exact attacked instance only while its damage message is emitted.
  // This deliberately avoids any same-name lookup: two goblins must never share FX.
  const baseAttack=attack;
  attack=function(enemy){
    if(!enemy)return baseAttack(enemy);
    window.__sushiLastHitTarget={x:enemy.x,y:enemy.y,enemy};
    try{
      return baseAttack(enemy);
    }finally{
      window.__sushiLastHitTarget=null;
    }
  };

  function gainExplosionExp(enemy){
    if(!enemy||enemy.hp>0)return;
    game.exp+=enemy.exp||0;
    log(`${enemy.name}を爆発で倒した。`);
    while(game.exp>=game.nextExp){
      game.exp-=game.nextExp;
      game.level++;
      game.nextExp=Math.floor(game.nextExp*1.45)+3;
      game.maxHp+=4;
      game.hp=game.maxHp;
      msg(`レベル${game.level}！ HP全回復。`);
      log(`Lv ${game.level}になった。`);
    }
  }

  function useExplosion(index,item){
    const cx=game.player.x,cy=game.player.y;
    const hit=[];
    for(const enemy of game.enemies){
      if(enemy.hp<=0)continue;
      const dx=Math.abs(enemy.x-cx),dy=Math.abs(enemy.y-cy);
      // 2D dungeon: a natural 5x5 blast zone (25 cells including the player cell).
      if(Math.max(dx,dy)<=2){
        const before=enemy.hp;
        enemy.hp=Math.max(0,enemy.hp-15);
        const killed=enemy.hp<=0;
        hit.push({x:enemy.x,y:enemy.y,name:enemy.name,damage:Math.min(15,before),killed});
        if(killed)gainExplosionExp(enemy);
      }
    }
    game.inventory.splice(index,1);
    $('inventoryDialog').close();
    render();
    window.dispatchEvent(new CustomEvent('sushi-explosion',{detail:{x:cx,y:cy,hit}}));
    if(hit.length){
      msg(`爆発！ 周囲の敵${hit.length}体に15ダメージ。`);
      log(`爆発の巻き物を使った。${hit.length}体を巻き込んだ。`);
    }else{
      msg('爆発！ しかし周囲に敵はいなかった。');
      log('爆発の巻き物を使った。');
    }
    endTurn();
    render();
  }

  const baseUseItem=useItem;
  useItem=function(index){
    const item=game?.inventory?.[index];
    if(item?.type==='scroll'&&item.effect==='explosion'){
      useExplosion(index,item);
      return;
    }
    return baseUseItem(index);
  };
})();
