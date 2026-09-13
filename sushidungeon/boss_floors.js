'use strict';
(function(){
  const BOSSES={
    10:{name:'ゴブリン隊長',icon:'👺',spriteBase:'緑小鬼',hp:42,atk:11,exp:28,message:'ゴブリン隊長が階段を封鎖している！'},
    20:{name:'巨大水スライム',icon:'💧',spriteBase:'水スライム',hp:78,atk:15,exp:55,message:'巨大水スライムが水路を塞いでいる！'}
  };
  const baseGenerate=generateFloor;
  const baseDescend=descend;
  function livingBoss(){return game?.enemies?.find(e=>e.isBoss&&e.hp>0)||null}
  function spawnBoss(){
    if(!game)return;
    const spec=BOSSES[game.floor];if(!spec||livingBoss()||game[`bossSpawned${game.floor}`])return;
    const occupiedKeys=new Set((game.enemies||[]).filter(e=>e.hp>0).map(e=>`${e.x},${e.y}`));
    const spots=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      if(!game.grid?.[y]?.[x])continue;
      if(x===game.player.x&&y===game.player.y)continue;
      if(x===game.exit.x&&y===game.exit.y)continue;
      if(occupiedKeys.has(`${x},${y}`))continue;
      const dist=Math.max(Math.abs(x-game.player.x),Math.abs(y-game.player.y));
      if(dist>=5)spots.push({x,y,dist});
    }
    spots.sort((a,b)=>b.dist-a.dist);
    const p=spots[0];if(!p)return;
    game.enemies.push({...spec,maxHp:spec.hp,min:game.floor,max:game.floor,x:p.x,y:p.y,asleep:false,motion:'idle',facing:'s',isBoss:true,bossFloor:game.floor});
    game[`bossSpawned${game.floor}`]=true;game[`bossDefeated${game.floor}`]=false;
    msg(`⚠ ${game.floor}F。${spec.message}`);
    log(`BOSS：${spec.name}が現れた。倒さなければ先へ進めない。`);
  }
  generateFloor=function(){const r=baseGenerate.apply(this,arguments);spawnBoss();return r};
  descend=function(){
    const spec=BOSSES[game?.floor];
    if(spec){
      const boss=livingBoss();
      if(boss){msg(`階段は${spec.name}に封鎖されている！`);log(`${spec.name}を倒さなければ${game.floor+1}Fへ進めない。`);if(typeof render==='function')render();return}
      game[`bossDefeated${game.floor}`]=true;
    }
    return baseDescend.apply(this,arguments)
  };
  const baseAttack=attack;
  attack=function(enemy){
    const wasBoss=!!enemy?.isBoss,alive=enemy?.hp>0,bossFloor=enemy?.bossFloor||game?.floor,name=enemy?.name;
    const r=baseAttack.apply(this,arguments);
    if(wasBoss&&alive&&enemy.hp<=0){game[`bossDefeated${bossFloor}`]=true;msg(`★ ${name}を倒した！ 階段の封印が解けた！`);log(`${bossFloor}F BOSS CLEAR：${name}撃破。`)}
    return r
  };
  window.sushiBossFloors={livingBoss,spawnBoss,BOSSES};
})();