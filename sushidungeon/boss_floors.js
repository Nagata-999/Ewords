'use strict';
(function(){
  const BOSS_FLOOR=10;
  const baseGenerate=generateFloor;
  const baseDescend=descend;

  function livingBoss(){return game?.enemies?.find(e=>e.isBoss&&e.hp>0)||null}
  function spawnBoss(){
    if(!game||game.floor!==BOSS_FLOOR||livingBoss()||game.bossSpawned10)return;
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
    game.enemies.push({name:'ゴブリン隊長',icon:'👺',spriteBase:'緑小鬼',hp:42,maxHp:42,atk:11,exp:28,min:10,max:10,x:p.x,y:p.y,asleep:false,motion:'idle',facing:'s',isBoss:true});
    game.bossSpawned10=true;game.bossDefeated10=false;
    msg('⚠ 10F。ゴブリン隊長が階段を封鎖している！');
    log('BOSS：ゴブリン隊長が現れた。倒さなければ先へ進めない。');
  }
  generateFloor=function(){const r=baseGenerate.apply(this,arguments);if(game?.floor===BOSS_FLOOR)spawnBoss();return r};
  descend=function(){
    if(game?.floor===BOSS_FLOOR){
      const boss=livingBoss();
      if(boss){msg('階段はゴブリン隊長に封鎖されている！');log('ゴブリン隊長を倒さなければ11Fへ進めない。');if(typeof render==='function')render();return}
      game.bossDefeated10=true;
    }
    return baseDescend.apply(this,arguments)
  };
  const baseAttack=attack;
  attack=function(enemy){const wasBoss=!!enemy?.isBoss,alive=enemy?.hp>0,r=baseAttack.apply(this,arguments);if(wasBoss&&alive&&enemy.hp<=0){game.bossDefeated10=true;msg('★ ゴブリン隊長を倒した！ 階段の封印が解けた！');log('10F BOSS CLEAR：ゴブリン隊長撃破。')}return r};
  window.sushiBossFloors={livingBoss,spawnBoss};
})();