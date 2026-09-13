'use strict';
(function(){
  const BOSS_FLOOR=1; // DEBUG: normally 10
  const baseGenerate=generateFloor;
  const baseDescend=descend;

  function livingBoss(){
    return game?.enemies?.find(e=>e.isBoss&&e.hp>0)||null;
  }

  function spawnBoss(){
    if(!game||game.floor!==BOSS_FLOOR||game.bossSpawned10)return;
    const occupiedKeys=new Set(game.enemies.filter(e=>e.hp>0).map(e=>`${e.x},${e.y}`));
    const far=[],near=[];
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      if(!game.grid[y][x])continue;
      if(x===game.player.x&&y===game.player.y)continue;
      if(x===game.exit.x&&y===game.exit.y)continue;
      if(occupiedKeys.has(`${x},${y}`))continue;
      const dist=Math.max(Math.abs(x-game.player.x),Math.abs(y-game.player.y));
      const cell={x,y,dist};
      if(dist>=5)far.push(cell); else if(dist>=2)near.push(cell);
    }
    far.sort((a,b)=>b.dist-a.dist);
    near.sort((a,b)=>b.dist-a.dist);
    const p=far[0]||near[0];
    if(!p){
      console.warn('[SushiDungeon] boss spawn failed: no free floor tile');
      return;
    }
    game.enemies.push({
      name:'ゴブリン隊長',icon:'👺',spriteBase:'緑小鬼',hp:42,maxHp:42,atk:11,exp:28,
      min:10,max:10,x:p.x,y:p.y,asleep:false,isBoss:true
    });
    game.bossSpawned10=true;
    game.bossDefeated10=false;
    msg('⚠ DEBUG：ゴブリン隊長が1Fに出現！');
    log('DEBUG BOSS：ゴブリン隊長が現れた。');
  }

  generateFloor=function(){
    const r=baseGenerate.apply(this,arguments);
    if(game?.floor===BOSS_FLOOR)spawnBoss();
    return r;
  };

  descend=function(){
    if(game?.floor===BOSS_FLOOR){
      const boss=livingBoss();
      if(boss){
        msg('階段はゴブリン隊長に封鎖されている！');
        log('ゴブリン隊長を倒さなければ先へ進めない。');
        if(typeof render==='function')render();
        return;
      }
      if(!game.bossDefeated10){
        game.bossDefeated10=true;
        msg('ゴブリン隊長を撃破！ 次の階への道が開いた。');
        log('DEBUG BOSS CLEAR：ゴブリン隊長撃破。');
      }
    }
    return baseDescend.apply(this,arguments);
  };

  const baseAttack=attack;
  attack=function(enemy){
    const wasBoss=!!enemy?.isBoss;
    const alive=enemy?.hp>0;
    const r=baseAttack.apply(this,arguments);
    if(wasBoss&&alive&&enemy.hp<=0){
      game.bossDefeated10=true;
      msg('★ ゴブリン隊長を倒した！ 階段の封印が解けた！');
      log('DEBUG BOSS CLEAR：ゴブリン隊長撃破。');
    }
    return r;
  };

  window.sushiBossFloors={livingBoss};
})();