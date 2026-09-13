'use strict';
(function(){
  const FINAL_FLOOR=100;
  const baseGenerate=generateFloor;
  const baseStart=startGame;

  // Keep each floor light enough for mobile. Enemy variety cycles every 10 floors,
  // while their stats scale with dungeon depth.
  generateFloor=function(){
    const realFloor=game.floor;
    const tierFloor=((realFloor-1)%10)+1;
    const zone=Math.floor((realFloor-1)/10);
    const savedMsg=msg;
    game.floor=tierFloor;
    msg=function(){};
    try{baseGenerate();}
    finally{
      msg=savedMsg;
      game.floor=realFloor;
    }
    if(zone>0){
      for(const e of game.enemies){
        const hpBonus=zone*5+Math.floor(realFloor/10);
        e.hp+=hpBonus;
        e.maxHp+=hpBonus;
        e.atk+=Math.floor(zone*1.2);
        e.exp=Math.max(1,Math.round(e.exp*(1+zone*.35)));
      }
    }
    msg(`${realFloor}F。階段を探そう。`);
  };

  startGame=function(){
    baseStart();
    if(Array.isArray(game.logs))game.logs=game.logs.map(x=>String(x).replace('10Fを目指せ','100Fを目指せ'));
    const source=document.getElementById('message');
    if(source)source.textContent='100Fを目指せ。英単語宝箱は毎階ひとつ。';
  };

  descend=function(){
    if(game.floor>=FINAL_FLOOR){reachTen();return;}
    game.floor++;
    generateFloor();
    log(`${game.floor}Fへ降りた。`);
    if(game.floor%10===0)log(`節目の${game.floor}Fに到達した。`);
    render();
  };

  reachTen=function(){
    const meta=readMeta(),best=Math.max(meta.bestFloor||0,FINAL_FLOOR);
    writeMeta({bestFloor:best,runs:(meta.runs||0)+1});
    const keepList=document.getElementById('keepList');
    keepList.replaceChildren();
    const unique=game.foundGear.filter((x,i,a)=>a.findIndex(y=>y.name===x.name&&y.type===x.type)===i);
    if(!unique.length)keepList.innerHTML='<p class="empty">持ち帰れる装備がない。</p>';
    for(const it of unique){
      const b=document.createElement('button');
      b.type='button';
      b.innerHTML=`<span>${it.icon} ${it.name}</span><small>アバタートロフィーとして保存</small>`;
      b.onclick=()=>{
        const m=readMeta(),t=[...(m.trophies||[])];
        t.push({...it,fromFloor:FINAL_FLOOR,obtainedAt:Date.now()});
        writeMeta({trophies:t,bestFloor:FINAL_FLOOR,runs:m.runs||0});
        document.getElementById('keepDialog').close();
        finishClear(it.name);
      };
      keepList.append(b);
    }
    const dialog=document.getElementById('keepDialog');
    const small=dialog?.querySelector('small');
    const h2=dialog?.querySelector('h2');
    if(small)small.textContent='100F REACHED';
    if(h2)h2.textContent='100F到達！ 1つだけ持ち帰れる';
    dialog?.showModal();
  };

  finishClear=function(name){
    game.dead=true;
    document.getElementById('gameOverTitle').textContent='100F制覇！';
    document.getElementById('gameOverText').textContent=(name?`${name}を持ち帰った。`:'今回は装備を持ち帰らなかった。')+' 不思議なダンジョン完全制覇。次の冒険も1Fから。';
    document.getElementById('gameOverDialog').showModal();
  };

  window.SUSHI_FINAL_FLOOR=FINAL_FLOOR;
})();