'use strict';
(function(){
  const BOSSES={
    10:{name:'ゴブリン隊長',icon:'👺',spriteBase:'緑小鬼',hp:42,atk:11,exp:28,message:'ゴブリン隊長が階段を封鎖している！'},
    20:{name:'巨大水スライム',icon:'💧',spriteBase:'水スライム',hp:78,atk:15,exp:55,message:'巨大水スライムが水路を塞いでいる！'},
    30:{name:'黒鉄の騎士長',icon:'🛡️',spriteBase:'黒鉄の騎士',hp:118,atk:19,exp:90,message:'黒鉄の騎士長が灼熱の最深部を守っている！'}
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
      if(!game.grid?.[y]?.[x])continue;if(x===game.player.x&&y===game.player.y)continue;if(x===game.exit.x&&y===game.exit.y)continue;if(occupiedKeys.has(`${x},${y}`))continue;
      const dist=Math.max(Math.abs(x-game.player.x),Math.abs(y-game.player.y));if(dist>=5)spots.push({x,y,dist});
    }
    spots.sort((a,b)=>b.dist-a.dist);const p=spots[0];if(!p)return;
    game.enemies.push({...spec,maxHp:spec.hp,min:game.floor,max:game.floor,x:p.x,y:p.y,asleep:false,motion:'idle',facing:'s',isBoss:true,bossFloor:game.floor,splitTriggered:false});
    game[`bossSpawned${game.floor}`]=true;game[`bossDefeated${game.floor}`]=false;
    msg(`⚠ ${game.floor}F。${spec.message}`);log(`BOSS：${spec.name}が現れた。倒さなければ先へ進めない。`);
  }
  function splitGiantSlime(boss){
    if(!game||game.floor!==20||!boss||boss.name!=='巨大水スライム'||boss.splitTriggered||boss.hp<=0||boss.hp>Math.ceil(boss.maxHp/2))return;
    boss.splitTriggered=true;const occupied=new Set((game.enemies||[]).filter(e=>e.hp>0&&e!==boss).map(e=>`${e.x},${e.y}`));occupied.add(`${game.player.x},${game.player.y}`);occupied.add(`${boss.x},${boss.y}`);
    const candidates=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dy)continue;const x=boss.x+dx,y=boss.y+dy;if(x<1||y<1||x>=W-1||y>=H-1||!game.grid?.[y]?.[x]||occupied.has(`${x},${y}`))continue;candidates.push({x,y,d:Math.max(Math.abs(dx),Math.abs(dy))})}candidates.sort((a,b)=>a.d-b.d);
    let spawned=0;for(const p of candidates){if(spawned>=2)break;if(occupied.has(`${p.x},${p.y}`))continue;game.enemies.push({name:'水スライム',icon:'💧',hp:18,maxHp:18,atk:9,exp:8,min:20,max:20,x:p.x,y:p.y,asleep:false,motion:'idle',facing:'s',summoned:true});occupied.add(`${p.x},${p.y}`);spawned++}
    if(spawned){try{window.dispatchEvent(new CustomEvent('sushi-water-split',{detail:{x:boss.x,y:boss.y,count:spawned}}))}catch{}msg(`💥 巨大水スライムが分裂した！ 水スライム${spawned}体が飛び散った！`);log(`20F BOSS PHASE：巨大水スライムがHP半分で分裂。水スライム${spawned}体を召喚。`);if(typeof render==='function')render()}
  }
  generateFloor=function(){const r=baseGenerate.apply(this,arguments);spawnBoss();return r};
  descend=function(){const spec=BOSSES[game?.floor];if(spec){const boss=livingBoss();if(boss){msg(`階段は${spec.name}に封鎖されている！`);log(`${spec.name}を倒さなければ先へ進めない。`);if(typeof render==='function')render();return}game[`bossDefeated${game.floor}`]=true}return baseDescend.apply(this,arguments)};
  const baseAttack=attack;
  attack=function(enemy){const wasBoss=!!enemy?.isBoss,alive=enemy?.hp>0,bossFloor=enemy?.bossFloor||game?.floor,name=enemy?.name;const r=baseAttack.apply(this,arguments);if(wasBoss&&alive&&enemy.hp>0)splitGiantSlime(enemy);if(wasBoss&&alive&&enemy.hp<=0){game[`bossDefeated${bossFloor}`]=true;msg(`★ ${name}を倒した！ 階段の封印が解けた！`);log(`${bossFloor}F BOSS CLEAR：${name}撃破。`)}return r};
  window.sushiBossFloors={livingBoss,spawnBoss,splitGiantSlime,BOSSES};
})();